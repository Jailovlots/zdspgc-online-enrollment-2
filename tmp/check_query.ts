import { db } from "../server/db";
import { students, courses } from "../shared/schema";
import { sql, eq } from "drizzle-orm";

async function checkQuery() {
  const results = await db
    .select({
      course: courses.code,
      name: courses.name,
      count: sql<number>`cast(count(${students.id}) as int)`,
      male: sql<number>`cast(count(case when lower(${students.gender}) = 'male' then 1 else null end) as int)`,
      female: sql<number>`cast(count(case when lower(${students.gender}) = 'female' then 1 else null end) as int)`,
      // Let's also check what lower(gender) returns
      gendersRaw: sql<string>`string_agg(coalesce(${students.gender}, 'NULL'), ', ')`,
      gendersLower: sql<string>`string_agg(coalesce(lower(${students.gender}), 'NULL'), ', ')`
    })
    .from(courses)
    .leftJoin(students, eq(courses.id, students.courseId))
    .groupBy(courses.code, courses.name);
  
  console.log("Query Results for Dashboard:");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

checkQuery().catch(err => {
  console.error(err);
  process.exit(1);
});
