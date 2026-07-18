import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { CATEGORIES } from '../src/data/catalog';
import { PRODUCTS } from '../src/data/products';
import { liftBuiltinCatalogOverlays } from '../src/services/catalogOverlays';

dotenv.config();
const prisma = new PrismaClient();

// Creates the login accounts and sample customers, and lifts the original 28
// categories out of the static file (src/data/catalog.ts) into the Category
// table — the file stays the source of the *initial* data, the table is the
// source of truth from then on, so the Admin app can actually add to it.

// Only fills the table when it is empty, and never overwrites an existing row:
// re-running the seed must not undo a category the admin edited or added.
async function seedCategories() {
  let added = 0;
  for (const c of CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { key: c.key } });
    if (existing) continue;
    await prisma.category.create({
      data: {
        key: c.key,
        name: c.name,
        short: c.short,
        blurb: c.blurb,
        unit: c.unit,
        origin: c.origin,
        skipGrade: c.skipGrade,
        count: c.count,
        sortOrder: c.sortOrder,
      },
    });
    added++;
  }
  const total = await prisma.category.count();
  console.log(`  Categories    -> ${added} added, ${total} in the catalogue`);
}

// Same contract as the categories above: fill from the static file only where a
// SKU is missing, so re-seeding never overwrites a price the admin has edited.
async function seedProducts() {
  let added = 0;
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { id: p.id } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        cat: p.cat,
        tone: p.tone,
        shape: p.shape,
        size: p.size,
        clarity: p.clarity,
        price: p.price,
        unit: p.unit,
        moq: p.moq,
        stock: p.stock,
        stockCount: p.stockCount,
        badge: p.badge ?? null,
        desc: p.desc ?? null,
      },
    });
    added++;
  }
  const total = await prisma.product.count();
  console.log(`  Products      -> ${added} added, ${total} SKUs`);
}

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

  await seedCategories();
  await seedProducts();

  // Lift the storefront's built-in colours/shapes into the admin overlays —
  // shared with server startup; idempotent (see src/services/catalogOverlays).
  const lifted = await liftBuiltinCatalogOverlays();
  console.log(`  Catalog overlays -> ${lifted.colours} colours, ${lifted.shapes} shapes lifted from the storefront data`);
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
