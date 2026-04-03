import { storage } from "../server/storage";
import { db } from "../server/db";
import { users } from "../shared/schema";

async function run() {
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers.map(u => ({ id: u.id, username: u.username })));
}

run().catch(console.error).finally(() => process.exit(0));
