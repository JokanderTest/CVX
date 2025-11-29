// api/scripts/createTestUser.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  const email = process.argv[2] || 'tester@example.com';
  const password = process.argv[3] || 'Password123!';
  const name = process.argv[4] || 'Test User';

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      locale: 'en',
      credits: 20,
      isEmailVerified: false,
    },
  });

  console.log('Created user:');
  console.log({ id: user.id, email: user.email, password });
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
