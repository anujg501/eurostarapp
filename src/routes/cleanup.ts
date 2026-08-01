import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { asyncHandler, ok, fail, failValidation } from '../util/http';
import { authenticate, requireRole } from '../auth/middleware';

// Test-data cleanup for the CRM.
//
// A demo/handover database fills up with trial customers, practice orders and
// receipts nobody wants the client to inherit, and until now there was no way
// to remove any of it: the CRM could only *suspend* a login, and no route
// deleted anything. This is that missing door — office/admin only, with the
// row counts shown before the deed and an explicit confirmation word required,
// because none of it can be undone.
export const cleanupRouter = Router();

// Deleting live trade records is not something a rep should be able to do, and
// not something to be reached by an expired token either.
const officeOnly = [authenticate, requireRole('office', 'admin')];

// The word the caller must type back to us. Nothing is deleted without it.
const CONFIRM_WORD = 'DELETE';

// What can be cleared, in the order the foreign keys allow. Payments point at
// orders, orders and carts and enquiries point at customers, so a customer can
// only go once everything hanging off it has gone first.
const SCOPES = ['payments', 'orders', 'carts', 'rfqs', 'visits', 'leads', 'customers'] as const;
type Scope = (typeof SCOPES)[number];

const purgeSchema = z.object({
  scopes: z.array(z.enum(SCOPES)).min(1),
  confirm: z.string(),
});

/** Row counts, so the screen can say exactly what is about to go. */
async function counts(): Promise<Record<string, number>> {
  const [customers, carts, orders, orderLines, payments, rfqs, checkIns, attendance, fieldVisits, leads] =
    await Promise.all([
      prisma.customer.count(),
      prisma.cart.count(),
      prisma.order.count(),
      prisma.orderLine.count(),
      prisma.payment.count(),
      prisma.rfq.count(),
      prisma.checkIn.count(),
      prisma.attendance.count(),
      prisma.fieldVisit.count(),
      prisma.lead.count(),
    ]);
  return {
    customers,
    carts,
    orders,
    orderLines,
    payments,
    rfqs,
    visits: checkIns + attendance + fieldVisits,
    leads,
  };
}

// GET /admin/cleanup/counts — what is in the database right now.
cleanupRouter.get(
  '/counts',
  ...officeOnly,
  asyncHandler(async (_req, res) => ok(res, await counts()))
);

// POST /admin/cleanup/purge  { scopes: [...], confirm: "DELETE" }
// Clears whole groups of test data. Everything runs in one transaction: a purge
// that fails half way through would leave orders pointing at customers that no
// longer exist, which is worse than not starting.
cleanupRouter.post(
  '/purge',
  ...officeOnly,
  asyncHandler(async (req, res) => {
    const parsed = purgeSchema.safeParse(req.body);
    if (!parsed.success) return failValidation(res, parsed.error);
    const { scopes, confirm } = parsed.data;
    if (confirm !== CONFIRM_WORD)
      return fail(res, 400, `Type ${CONFIRM_WORD} to confirm — nothing was deleted.`);

    const want = (s: Scope) => scopes.includes(s);
    // Clearing customers means clearing what belongs to them, whether or not
    // those boxes were ticked — the foreign keys leave no other order.
    const cust = want('customers');
    const deleted: Record<string, number> = {};
    const bump = (k: string, n: number) => { deleted[k] = (deleted[k] ?? 0) + n; };

    // Ticking a group clears that whole table. Ticking only "Customers" clears
    // what belongs to a customer and nothing else — an order or receipt with no
    // customer on it is somebody else's record, not this customer's, and it
    // should survive a customer purge.
    const ofCustomer = { NOT: { customerId: null } };

    await prisma.$transaction(async (tx) => {
      if (want('payments')) {
        bump('payments', (await tx.payment.deleteMany({})).count);
      } else if (cust) {
        // Receipts filed against the customer, and receipts filed against one of
        // their orders (the order reference has no cascade of its own).
        bump(
          'payments',
          (await tx.payment.deleteMany({ where: { OR: [ofCustomer, { order: ofCustomer }] } })).count
        );
      }
      if (cust || want('orders')) {
        const where = want('orders') ? {} : ofCustomer;
        // Order lines cascade with the order; count them first so the report is honest.
        bump('orderLines', await tx.orderLine.count({ where: { order: where } }));
        // Any remaining receipt naming one of these orders would trip the
        // foreign key, so clear those before the orders go.
        const attached = (await tx.payment.deleteMany({ where: { order: where } })).count;
        if (attached) bump('payments', attached);
        bump('orders', (await tx.order.deleteMany({ where })).count);
      }
      if (cust || want('carts')) {
        const where = want('carts') ? {} : ofCustomer;
        bump('cartLines', await tx.cartLine.count({ where: { cart: where } }));
        bump('carts', (await tx.cart.deleteMany({ where })).count);
      }
      if (cust || want('rfqs')) bump('rfqs', (await tx.rfq.deleteMany({ where: want('rfqs') ? {} : ofCustomer })).count);
      if (want('visits')) {
        bump('visits', (await tx.checkIn.deleteMany({})).count);
        bump('visits', (await tx.attendance.deleteMany({})).count);
        bump('visits', (await tx.fieldVisit.deleteMany({})).count);
      }
      if (want('leads')) bump('leads', (await tx.lead.deleteMany({})).count);

      if (cust) {
        // The shop's phone number is also its login. Leaving the User behind
        // would keep that number occupied, so the same shop could never sign up
        // again — take the customer logins with the customers. Staff logins
        // (rep/office/admin) and LMS candidates are left alone.
        const phones = (await tx.customer.findMany({ select: { phone: true } }))
          .map((c) => c.phone)
          .filter((p): p is string => !!p);
        bump('customers', (await tx.customer.deleteMany({})).count);
        if (phones.length) {
          const logins = await tx.user.findMany({ where: { role: 'customer', phone: { in: phones } }, select: { id: true } });
          const ids = logins.map((u) => u.id);
          if (ids.length) {
            // Refresh tokens cascade off the user.
            bump('logins', (await tx.user.deleteMany({ where: { id: { in: ids } } })).count);
          }
        }
      }
    });

    return ok(res, { deleted, remaining: await counts() });
  })
);

export default cleanupRouter;
