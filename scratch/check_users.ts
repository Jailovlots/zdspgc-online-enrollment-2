import { db } from "../server/db";
import { users } from "../shared/schema";

async function checkUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log("Current Users in DB:");
    allUsers.forEach(u => {
      console.log(`- Username: ${u.username}, Role: ${u.role}, ID: ${u.id}`);
    });
  } catch (err) {
    console.error("Error checking users:", err);
  } finally {
    process.exit(0);
  }
}

checkUsers();
