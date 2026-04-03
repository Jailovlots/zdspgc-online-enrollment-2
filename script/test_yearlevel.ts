import { db } from "../server/db.js";
import { enrollments, students, subjects } from "../shared/schema.js";
import { storage } from "../server/storage.js";

async function main() {
  try {
    const user = await storage.createUser({
      username: "test_yl_" + Date.now(),
      password: "password123",
      role: "student"
    });
    
    // Create student
    const student = await storage.createStudent({
      id: user.id,
      firstName: "YL",
      lastName: "Test",
      yearLevel: 4, 
      status: "not-enrolled",
    } as any);

    // Create enrollment with yearLevel 4
    const subs = await db.select().from(subjects).limit(1);
    const enrollment = await storage.createEnrollment(user.id, {
      academicYear: "2024-2025",
      semester: "1st Semester",
      yearLevel: 4
    }, [subs[0].id]);

    console.log("Student Year Level:", student.yearLevel);
    console.log("Enrollment Year Level:", enrollment.yearLevel);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
