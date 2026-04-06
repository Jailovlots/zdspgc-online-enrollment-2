import { db } from "../server/db";
import { students } from "../shared/schema";
import { sql } from "drizzle-orm";

async function checkGenders() {
  const genderCounts = await db
    .select({
      gender: students.gender,
      count: sql<number>`count(*)`,
    })
    .from(students)
    .groupBy(students.gender);
  
  console.log("Gender Distribution in DB:");
  console.log(JSON.stringify(genderCounts, null, 2));
  process.exit(0);
}

checkGenders().catch(err => {
  console.error(err);
  process.exit(1);
});
