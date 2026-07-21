import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

// Resets a staff login's password against whichever database DATABASE_URL
// points at — the local one, or production when run on the server.
//
//   npm run set-password -- --user admin --password "NewPass123"
//   ADMIN_PASSWORD="NewPass123" npm run set-password        (user defaults to admin)
//
// The password is deliberately NOT read from a committed file: it is passed at
// run time so a real credential never lands in the repository. Only the hash is
// stored, and nothing prints the password back out.

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const username = arg('user') ?? process.env.ADMIN_USER ?? 'admin';
  const password = arg('password') ?? process.env.ADMIN_PASSWORD ?? '';

  if (!password) {
    console.error(
      'No password given.\n' +
        '  npm run set-password -- --user admin --password "NewPass123"\n' +
        '  ADMIN_PASSWORD="NewPass123" npm run set-password'
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({ where: { userId: username } });
  if (!user) {
    const staff = await prisma.user.findMany({
      where: { userId: { not: null } },
      select: { userId: true, role: true },
    });
    console.error(
      `No login called "${username}".\n` +
        'Existing staff logins: ' +
        (staff.map((s) => `${s.userId} (${s.role})`).join(', ') || 'none')
    );
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });

  // Any "remember me" session issued earlier keeps working otherwise, which is
  // wrong when the password is being changed because it may have leaked.
  const revoked = await prisma.refreshToken.updateMany({
    where: { userId: user.id, revoked: false },
    data: { revoked: true },
  });

  console.log(`Password updated for "${username}" (${user.role}).`);
  console.log(`Signed out ${revoked.count} remembered session(s) — sign in again with the new password.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
