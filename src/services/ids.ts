import { prisma } from '../db';

/**
 * Generate a human-friendly, sequential order id like "ESO-2026-0001".
 * Uses a Counter row so ids never collide even under concurrent orders.
 */
export async function nextOrderId(year = new Date().getFullYear()): Promise<string> {
  const key = `order:${year}`;
  const counter = await prisma.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `ESO-${year}-${counter.value.toString().padStart(4, '0')}`;
}

/**
 * Generate a customer code like "CUST-1042".
 */
export async function nextCustomerCode(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { key: 'customer' },
    create: { key: 'customer', value: 1001 },
    update: { value: { increment: 1 } },
  });
  return `CUST-${counter.value}`;
}
