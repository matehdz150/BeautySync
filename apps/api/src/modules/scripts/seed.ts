/* eslint-disable prettier/prettier */
import "dotenv/config";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { users } from "../db/schema";

async function main() {
  const email = "admin@beautyflow.com";
  const password = "admin123";

  console.log("🔍 Checking if admin exists...");

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    console.log("⚠️ Admin already exists. Skipping.");
    return;
  }

  console.log("🔐 Creating admin...");

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    passwordHash,
    role: "admin",
    organizationId: null,
  });

  console.log("✅ Admin created!");
  console.log("📧 Email:", email);
  console.log("🔑 Password:", password);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});