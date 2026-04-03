import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Synchronizing enrollment year levels with student year levels to fix migration corruption...");
    
    // Using raw SQL to easily update join between tables
    await db.execute(sql`
      UPDATE enrollments 
      SET year_level = students.year_level 
      FROM students 
      WHERE enrollments.student_id = students.id 
      AND enrollments.year_level = 1 
      AND students.year_level != 1;
    `);

    console.log("Database year levels synchronized successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
