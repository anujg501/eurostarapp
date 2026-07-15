import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// The real catalogue (28 categories, shapes, tones, prices) lives in the
// frontend app/data.jsx and is served by the API from src/data/catalog.ts.
// The seed only needs to create login accounts and a few sample customers so
// you can test the ordering, payment and CRM flows end-to-end.

async function main() {
  const adminUser = process.env.SEED_ADMIN_USER ?? 'admin';
  const adminPass = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const officeUser = process.env.SEED_OFFICE_USER ?? 'office';
  const officePass = process.env.SEED_OFFICE_PASSWORD ?? 'office123';
  const repIdVal = process.env.SEED_REP_ID ?? 'REP-204'; // matches the app's default rep id
  const repPass = process.env.SEED_REP_PASSWORD ?? 'rep123';

  // The owner/admin account. Protected from deletion in the Users & access screen.
  await prisma.user.upsert({
    where: { userId: adminUser },
    create: {
      role: 'admin',
      name: 'Administrator',
      userId: adminUser,
      passwordHash: await bcrypt.hash(adminPass, 10),
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { userId: officeUser },
    create: {
      role: 'office',
      name: 'Back Office',
      userId: officeUser,
      passwordHash: await bcrypt.hash(officePass, 10),
    },
    update: {},
  });

  const rep = await prisma.user.upsert({
    where: { userId: repIdVal },
    create: {
      role: 'rep',
      name: 'Rohit Shah', // matches the app's default rep name
      userId: repIdVal,
      repId: repIdVal,
      passwordHash: await bcrypt.hash(repPass, 10),
    },
    update: {},
  });

  // Sample customers mapped to the rep (shapes match the checkout customer book).
  if ((await prisma.customer.count()) === 0) {
    await prisma.customer.createMany({
      data: [
        { code: 'EUR-10482', name: 'Kiran Jewellers', phone: '9314588201', city: 'Surat', terms: '30', repUserId: rep.id },
        { code: 'EUR-10238', name: 'Al Noor Trading LLC', phone: '971504412290', city: 'Dubai', terms: '45', repUserId: rep.id },
        { code: 'EUR-10517', name: 'Shraddha Gems', phone: '9820011223', city: 'Mumbai', terms: 'cash', repUserId: rep.id },
      ],
    });
  }

  // Mira assistant default config.
  await prisma.assistantConfig.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      enabled: true,
      instructions: 'You are Mira, a friendly assistant for Eurostar, a B2B wholesale gemstone platform.',
      rules: JSON.stringify(['Be concise.', 'Never quote prices you are not sure about.', 'Escalate order issues to a human.']),
      knowledge: JSON.stringify([
        { title: 'Taxes & shipping', text: 'GST is 3% (waived on export). Courier is free over ₹1,000, else ₹300. Dispatch in 3 working days (5 for export).' },
        { title: 'Catalogue', text: 'Eurostar sells 28 categories incl. moissanite, lab-grown, Color CZ, mother of pearl and pearls.' },
      ]),
      examples: JSON.stringify([{ q: 'What is the minimum order?', a: 'The cart minimum is ₹1,000; RFQ enquiries need ₹10,000.' }]),
    },
    update: {},
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
  console.log(`  Admin login   -> id: ${adminUser}  password: ${adminPass}`);
  console.log(`  Office login  -> id: ${officeUser}  password: ${officePass}`);
  console.log(`  Rep login     -> id: ${repIdVal}  password: ${repPass}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
