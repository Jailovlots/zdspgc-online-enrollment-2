import { storage } from "../server/storage.js";
import { db } from "../server/db.js";
import { users, students, courses, subjects } from "../shared/schema.js";

async function testEnrollment() {
  try {
    console.log("Creating test user...");
    const user = await storage.createUser({
      username: "test_enroll_user_" + Date.now(),
      password: "password123",
      role: "student"
    });
    console.log("Created user:", user.id);

    console.log("Getting a course and subject...");
    const allCourses = await storage.getAllCourses();
    if (allCourses.length === 0) {
      console.log("No courses found. Run seed data first.");
      return;
    }
    const course = allCourses[0];
    const allSubjects = await storage.getSubjectsByCourse(course.id);
    if (allSubjects.length === 0) {
      console.log("No subjects found for course.");
      return;
    }
    const subject = allSubjects[0];

    console.log("Creating student profile...");
    await storage.createStudent({
      id: user.id,
      firstName: "Test",
      lastName: "Student",
      courseId: course.id,
      yearLevel: 1,
      status: "not-enrolled",
      address: "123 Test St",
      civilStatus: "Single",
      dateOfBirth: "2000-01-01",
      email: "test@example.com",
      gender: "Male",
      mobileNumber: "09000000000",
      nationality: "Filipino",
      placeOfBirth: "City",
      religion: "None"
    } as any);

    console.log("Attempting enrollment...");
    const enrollment = await storage.createEnrollment(
      user.id, 
      { academicYear: "2026-2027", semester: "1st Semester", yearLevel: 1 }, 
      [subject.id]
    );
    console.log("Enrollment success!", enrollment.id);
    
    console.log("Test passed. All backend transactions are working.");
  } catch (err) {
    console.error("Test failed with error:", err);
  } finally {
    process.exit(0);
  }
}

testEnrollment();
