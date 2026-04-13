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

async function resetAdmin() {
  const adminUsername = "admin";
  const adminPassword = "admin123";

  try {
    const hashedPassword = await hashPassword(adminPassword);
    
    const [existingAdmin] = await db.select().from(users).where(eq(users.username, adminUsername));
    
    if (existingAdmin) {
      console.log(`Found existing admin. Resetting password for user ${adminUsername}...`);
      await db.update(users)
        .set({ password: hashedPassword, role: "admin" })
        .where(eq(users.username, adminUsername));
      console.log("Admin password reset successfully!");
    } else {
      console.log(`Admin user does not exist. Creating ${adminUsername}...`);
      await db.insert(users).values({
        username: adminUsername,
        password: hashedPassword,
        role: "admin",
      });
      console.log("Admin user created successfully!");
    }
  } catch (err) {
    console.error("Failed to reset admin:", err);
  } finally {
    process.exit(0);
  }
}

resetAdmin();
