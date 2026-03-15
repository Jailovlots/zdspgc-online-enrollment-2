import { scrypt as scryptCallback, randomBytes as randomBytesCallback } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import "dotenv/config";

const scrypt = promisify(scryptCallback);
const randomBytes = promisify(randomBytesCallback);

async function hashPassword(password: string) {
  const salt = (await randomBytes(16)).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return salt + ":" + derivedKey.toString("hex");
}

async function seedAdmin() {
  const adminUsername = "admin";
  const adminPassword = "admin123";

  try {
    const [existingAdmin] = await db.select().from(users).where(eq(users.username, adminUsername));
    
    if (existingAdmin) {
      console.log("Admin user already exists.");
      return;
    }

    const hashedPassword = await hashPassword(adminPassword);
    await db.insert(users).values({
      username: adminUsername,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin user created successfully!");
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
  } catch (err) {
    console.error("Failed to seed admin:", err);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
