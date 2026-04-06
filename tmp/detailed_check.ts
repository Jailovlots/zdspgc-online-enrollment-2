import { db } from "../server/db";
import { students, courses } from "../shared/schema";
import { sql, eq } from "drizzle-orm";

async function detailedCheck() {
  const results = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      gender: students.gender,
      status: students.status,
      courseCode: courses.code
    })
    .from(students)
    .leftJoin(courses, eq(students.courseId, courses.id));
  
  console.log("Detailed Student List with Gender and Course:");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

detailedCheck().catch(err => {
  console.error(err);
  process.exit(1);
});
