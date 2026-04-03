import { db } from "../server/db.js";
import { enrollments, students } from "../shared/schema.js";

async function main() {
  const es = await db.select().from(enrollments);
  const ss = await db.select().from(students);
  console.log("Enrollments:", es.map(e => ({id: e.id, studentId: e.studentId, yearLevel: e.yearLevel, status: e.status})));
  console.log("Students:", ss.map(s => ({id: s.id, yearLevel: s.yearLevel, status: s.status})));
  process.exit(0);
}

main();
