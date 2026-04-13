import { storage } from "../server/storage";

async function test() {
  try {
    // Find a student
    const students = await storage.getAllStudents();
    if (students.length === 0) {
      console.log("No students found to test with.");
      return;
    }
    
    const student = students[0];
    console.log(`Testing with student: ${student.id}`);
    
    const notification = await storage.createNotification({
      studentId: student.id,
      title: "Test Portal Notification",
      message: "This is a test message",
      type: "portal",
      status: "sent"
    });
    
    console.log("Notification created successfully:", notification);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
