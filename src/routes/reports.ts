import { Router } from 'express';
import { prisma } from '../db';
import { asyncHandler, ok } from '../util/http';
import { authenticate } from '../auth/middleware';

// Read-only analytics for the CRM dashboard. Everything here is DERIVED from the
// real orders, payments, customers and reps already in the database — nothing is
// seeded. These replace the hardcoded CRM_SALES_BY_MONTH / _BY_CATEGORY /
// leaderboard arrays the console shipped with.
//
// Staff only: the CRM is an internal console. A customer token still
// authenticates, but the numbers are business-wide, so this is gated to staff.
export const reportsRouter = Router();

reportsRouter.use(
  authenticate,
  (req, res, next) => {
    const role = (req as { user?: { role?: string } }).user?.role;
    if (role === 'customer') return res.status(403).json({ error: 'Staff only' });
    return next();
  }
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Orders that represent real revenue. A cancelled order is excluded so it does
// not inflate the totals it was rolled back from.
const REVENUE_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

// Translate the Reports screen's period dropdown into a createdAt date filter.
// Returns undefined ("all time") for anything unrecognised.
function periodRange(period?: string): { gte: Date; lt: Date } | undefined {
  if (!period || period === 'all') return undefined;
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  if (period === 'month') return { gte: new Date(y, m, 1), lt: new Date(y, m + 1, 1) };
  if (period === 'last') return { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  if (period === 'quarter') { const q = Math.floor(m / 3) * 3; return { gte: new Date(y, q, 1), lt: new Date(y, q + 3, 1) }; }
  if (period === 'ytd') return { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
  return undefined;
}

// GET /reports/sales-by-month — revenue and order count per calendar month, oldest first.
reportsRouter.get(
  '/sales-by-month',
  asyncHandler(async (req, res) => {
    const range = periodRange(typeof req.query.period === 'string' ? req.query.period : undefined);
    const orders = await prisma.order.findMany({
      where: { status: { in: REVENUE_STATUSES }, ...(range ? { createdAt: range } : {}) },
      select: { grand: true, createdAt: true, clientTs: true },
    });

    const buckets = new Map<string, { m: string; sort: number; revenue: number; orders: number }>();
    for (const o of orders) {
      // Prefer the client's own timestamp (when it was placed) over the row's
      // createdAt, which is when it reached the server — they differ for orders
      // flushed from the offline queue.
      const d = o.clientTs ? new Date(Number(o.clientTs)) : o.createdAt;
      if (!d || isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      const b = buckets.get(key) ?? { m: label, sort: d.getFullYear() * 12 + d.getMonth(), revenue: 0, orders: 0 };
      b.revenue += o.grand || 0;
      b.orders += 1;
      buckets.set(key, b);
    }

    const rows = [...buckets.values()].sort((a, b) => a.sort - b.sort).map(({ m, revenue, orders }) => ({ m, revenue, orders }));
    return ok(res, rows);
  })
);

// GET /reports/sales-by-category — revenue and order count per category, richest first.
reportsRouter.get(
  '/sales-by-category',
  asyncHandler(async (req, res) => {
    const range = periodRange(typeof req.query.period === 'string' ? req.query.period : undefined);
    const lines = await prisma.orderLine.findMany({
      where: { order: { status: { in: REVENUE_STATUSES }, ...(range ? { createdAt: range } : {}) } },
      select: { categoryKey: true, lineTotal: true, orderId: true },
    });

    // Map category keys to their display names; fall back to the key itself.
    const cats = await prisma.category.findMany({ select: { key: true, name: true } });
    const nameOf = new Map(cats.map((c) => [c.key, c.name] as const));

    const buckets = new Map<string, { cat: string; revenue: number; orderIds: Set<string> }>();
    for (const l of lines) {
      const key = l.categoryKey || 'uncategorised';
      const b = buckets.get(key) ?? { cat: nameOf.get(key) || key, revenue: 0, orderIds: new Set() };
      b.revenue += l.lineTotal || 0;
      b.orderIds.add(l.orderId);
      buckets.set(key, b);
    }

    const rows = [...buckets.values()]
      .map(({ cat, revenue, orderIds }) => ({ cat, revenue, orders: orderIds.size }))
      .sort((a, b) => b.revenue - a.revenue);
    return ok(res, rows);
  })
);

// GET /reports/leaderboard — revenue and order count per rep, top first.
reportsRouter.get(
  '/leaderboard',
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      where: { status: { in: REVENUE_STATUSES }, repId: { not: null } },
      select: { repId: true, repName: true, grand: true },
    });

    const buckets = new Map<string, { repId: string; name: string; revenue: number; orders: number }>();
    for (const o of orders) {
      const id = o.repId as string;
      const b = buckets.get(id) ?? { repId: id, name: o.repName || id, revenue: 0, orders: 0 };
      b.revenue += o.grand || 0;
      b.orders += 1;
      buckets.set(id, b);
    }

    const rows = [...buckets.values()].sort((a, b) => b.revenue - a.revenue);
    return ok(res, rows);
  })
);

// GET /reports/summary — every dashboard headline counter, computed live from
// the database. No static values: each field is a real query.
const CANCELLED_STATUSES = ['cancelled', 'rejected', 'returned', 'refunded'];
const OPEN_ORDER_STATUSES = ['awaiting-payment', 'pending', 'confirmed', 'packed', 'shipped', 'dispatched', 'out-for-delivery'];

reportsRouter.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      orderCount, pendingOrders, ordersToday, ordersMonth,
      customerCount, repCount, openRfq,
      mtdSalesAgg, revenueAgg, paidAgg,
      activeCustomerRows, openCartCount, openCartValueAgg,
      pendingPayments, rejectedPayments, todaysCollectionsAgg, verifiedTodayCount,
    ] = await Promise.all([
      // Orders = New + Confirmed + Packed + Dispatched + Out-for-delivery.
      prisma.order.count({ where: { status: { in: OPEN_ORDER_STATUSES } } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.customer.count(),
      prisma.user.count({ where: { role: 'rep', active: true } }),
      prisma.rfq.count({ where: { status: { not: 'closed' } } }).catch(() => 0),
      // Total Sales (MTD) = SUM(grand) this month, excluding cancelled family.
      prisma.order.aggregate({ _sum: { grand: true }, where: { status: { notIn: CANCELLED_STATUSES }, createdAt: { gte: monthStart } } }),
      // All-time revenue for the payments/outstanding widgets.
      prisma.order.aggregate({ _sum: { grand: true }, where: { status: { notIn: CANCELLED_STATUSES } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'confirmed' } }).catch(() => ({ _sum: { amount: 0 } })),
      // Active Customers = distinct customers with at least one order.
      prisma.order.findMany({ where: { customerId: { not: null } }, distinct: ['customerId'], select: { customerId: true } }),
      prisma.cart.count({ where: { status: 'active' } }),
      prisma.cartLine.aggregate({ _sum: { lineTotal: true }, where: { cart: { status: 'active' } } }),
      // Payment verification counters.
      prisma.payment.count({ where: { status: 'pending' } }),
      prisma.payment.count({ where: { status: 'failed' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'confirmed', loggedAt: { gte: todayStart } } }),
      prisma.payment.count({ where: { status: 'confirmed', verifiedAt: { gte: todayStart } } }),
    ]);

    const mtdSales = mtdSalesAgg._sum.grand || 0;
    const revenue = revenueAgg._sum.grand || 0;
    const collected = paidAgg._sum.amount || 0;
    return ok(res, {
      orders: orderCount,
      pendingOrders,
      ordersToday,
      ordersMonth,
      mtdSales,
      avgOrderValue: ordersMonth ? Math.round(mtdSales / ordersMonth) : 0,
      customers: customerCount,
      activeCustomers: activeCustomerRows.length,
      reps: repCount,
      openRfq,
      openCarts: openCartCount,
      openCartsValue: openCartValueAgg._sum.lineTotal || 0,
      revenue,
      collected,
      outstanding: Math.max(0, revenue - collected),
      pendingPayments,
      rejectedPayments,
      todaysCollections: todaysCollectionsAgg._sum.amount || 0,
      verifiedToday: verifiedTodayCount,
    });
  })
);
