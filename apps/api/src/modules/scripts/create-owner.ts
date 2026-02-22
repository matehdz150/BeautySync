/* eslint-disable no-console */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { db } from '../db/client';
import { users } from '../db/schema';

async function main() {
  console.log('DATABASE_URL =', process.env.DATABASE_URL);
  const email = 'mauro@test.com';
  const password = '12345678';

  console.log('🔍 Checking if owner exists...');

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    console.log('⚠️ Owner already exists. Skipping.');
    return;
  }

  console.log('🔐 Creating owner...');

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    passwordHash,
    role: 'owner',
    organizationId: null,
  });

  console.log('✅ Owner created!');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
