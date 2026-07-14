import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// NOTE: This is PLACEHOLDER catalog data so you can test the backend today.
// The REAL catalog lives in the frontend file `app/data.jsx` (categories,
// grades, colours, shapes, sizes and prices). Once that file is added to the
// repo, we replace the sample below with the exact data so prices match the UI.
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { key: 'moissanite', name: 'Moissanite', unit: 'ct', sortOrder: 1 },
  { key: 'lab-grown', name: 'Lab-Grown Diamond', unit: 'ct', sortOrder: 2 },
  { key: 'color-cz', name: 'Color CZ', unit: 'pc', sortOrder: 3 },
  { key: 'mother-of-pearl', name: 'Mother of Pearl', unit: 'pc', sortOrder: 4 },
  { key: 'pearls', name: 'Pearls', unit: 'strip', sortOrder: 5 },
];

const GRADES = ['DEF', 'GH', 'IJ'];
const COLOURS = ['White', 'Yellow', 'Pink', 'Blue', 'Green'];
const SHAPES = ['Round', 'Oval', 'Pear', 'Cushion', 'Emerald'];
const SIZES = ['1.0mm', '1.5mm', '2.0mm', '2.5mm', '3.0mm', '4.0mm'];

async function main() {
  // --- Staff accounts -------------------------------------------------------
  const officeUser = process.env.SEED_OFFICE_USER ?? 'office';
  const officePass = process.env.SEED_OFFICE_PASSWORD ?? 'office123';
  const repIdVal = process.env.SEED_REP_ID ?? 'REP001';
  const repPass = process.env.SEED_REP_PASSWORD ?? 'rep123';

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
      name: 'Sales Rep One',
      userId: repIdVal,
      repId: repIdVal,
      passwordHash: await bcrypt.hash(repPass, 10),
    },
    update: {},
  });

  // --- A couple of sample customers mapped to the rep ----------------------
  const existingCustomers = await prisma.customer.count();
  if (existingCustomers === 0) {
    await prisma.customer.createMany({
      data: [
        { code: 'CUST-1001', name: 'Sunrise Jewellers', phone: '9800000001', city: 'Mumbai', terms: '30', repUserId: rep.id },
        { code: 'CUST-1002', name: 'Golden Touch Gems', phone: '9800000002', city: 'Surat', terms: 'cash', repUserId: rep.id },
      ],
    });
  }

  // --- Catalog --------------------------------------------------------------
  for (const c of CATEGORIES) {
    await prisma.category.upsert({ where: { key: c.key }, create: c, update: c });
  }

  const skuCount = await prisma.sku.count();
  if (skuCount === 0) {
    let basePrice = 100;
    for (const cat of CATEGORIES) {
      for (const size of SIZES) {
        // Vary a little so different variants have different prices.
        const grade = cat.unit === 'ct' ? GRADES[SIZES.indexOf(size) % GRADES.length] : null;
        const colour = cat.key === 'color-cz' ? COLOURS[SIZES.indexOf(size) % COLOURS.length] : null;
        const shape = cat.unit === 'ct' ? SHAPES[SIZES.indexOf(size) % SHAPES.length] : null;
        basePrice += 15;
        await prisma.sku.create({
          data: {
            categoryKey: cat.key,
            grade,
            colour,
            shape,
            size,
            unit: cat.unit,
            pricePerPiece: basePrice,
            packetPcs: cat.unit === 'pkt' ? 10 : null,
            soldOut: false,
          },
        });
      }
    }
  }

  // --- Mira assistant default config ---------------------------------------
  await prisma.assistantConfig.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      enabled: true,
      instructions: 'You are Mira, a friendly assistant for Eurostar, a B2B wholesale gemstone platform.',
      rules: 'Be concise. Never quote prices you are not sure about. Escalate order issues to a human.',
      knowledge: 'Eurostar sells moissanite, lab-grown diamonds, Color CZ, mother of pearl and pearls. GST is 3%. Courier is free over ₹1,000. Dispatch in 3 working days.',
      examples: '',
    },
    update: {},
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
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
