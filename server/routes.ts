import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertStudentSchema, insertEnrollmentSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import NodeCache from "node-cache";
import { notifyStudent } from "./lib/notifications";
import { broadcastToStudents } from "./lib/socket";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Cache (node-cache)
const myCache = new NodeCache({ stdTTL: 300 }); // 5 minutes default TTL

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

async function seedData() {
  const coursesCount = (await storage.getAllCourses()).length;
  if (coursesCount === 0) {
    const course = await storage.createCourse({
      code: "BSIS",
      name: "Bachelor of Science in Information System",
      description: "Focuses on the study of computer utilization and information system development.",
    });

    const subjects = [
      { code: "IT 101", name: "Introduction to Computing", units: 3, schedule: "MWF 8:00-9:00 AM", instructor: "Prof. Santos", courseId: course.id },
      { code: "IT 102", name: "Computer Programming 1", units: 3, schedule: "TTh 9:00-10:30 AM", instructor: "Prof. Reyes", courseId: course.id },
      { code: "GE 1", name: "Understanding the Self", units: 3, schedule: "MWF 10:00-11:00 AM", instructor: "Prof. Dizon", courseId: course.id },
    ];

    for (const s of subjects) {
      await storage.createSubject(s);
    }
  }
}

/**
 * Synchronizes key system settings to the .env file.
 */
function syncToEnv(updates: Record<string, string>) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    let content = "";
    
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    let lines = content.split("\n");
    for (const [key, value] of Object.entries(updates)) {
      if (!value) continue;
      const index = lines.findIndex(line => line.trim().startsWith(`${key}=`));
      if (index !== -1) {
        lines[index] = `${key}=${value}`;
      } else {
        lines.push(`${key}=${value}`);
      }
    }

    fs.writeFileSync(envPath, lines.join("\n").trim() + "\n");
    console.log("[SYNC] .env file updated successfully.");
  } catch (err) {
    console.error("[SYNC] Error updating .env file:", err);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  await seedData();

  // Static serving for uploads
  app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

  // File Upload Route
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Courses and Subjects
  let coursesLoading = false;

  app.get("/api/courses", async (_req, res) => {
    try {
      const cached = myCache.get("courses");
      if (cached) {
        return res.json(JSON.parse(cached as string));
      }
    } catch (err) {
      console.error("Cache get error:", err);
    }

    if (coursesLoading) {
      return res.status(503).send("Server busy, try again");
    }

    coursesLoading = true;

    try {
      const courses = await storage.getAllCourses();

      try {
        myCache.set("courses", JSON.stringify(courses));
      } catch (err) {
        console.error("Cache set error:", err);
      }

      coursesLoading = false;
      res.json(courses);
    } catch (err) {
      coursesLoading = false;
      console.error("Error fetching courses:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/api/courses", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const course = await storage.createCourse(req.body);
    myCache.set("courses", JSON.stringify(await storage.getAllCourses()));
    res.status(201).json(course);
  });

  app.patch("/api/courses/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const course = await storage.updateCourse(req.params.id, req.body);
    myCache.set("courses", JSON.stringify(await storage.getAllCourses()));
    res.json(course);
  });

  app.delete("/api/courses/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    await storage.deleteCourse(req.params.id);
    myCache.set("courses", JSON.stringify(await storage.getAllCourses()));
    res.sendStatus(204);
  });

  app.get("/api/courses/:courseId/subjects", async (req, res) => {
    const subjects = await storage.getSubjectsByCourse(req.params.courseId);
    res.json(subjects);
  });

  app.post("/api/subjects", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const subject = await storage.createSubject(req.body);
    res.status(201).json(subject);
  });

  app.patch("/api/subjects/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const subject = await storage.updateSubject(req.params.id, req.body);
    res.json(subject);
  });

  app.delete("/api/subjects/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    await storage.deleteSubject(req.params.id);
    res.sendStatus(204);
  });

  // Student Profile
  app.get("/api/student/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const profile = await storage.getStudentProfile(req.user.id);
    res.json(profile);
  });

  app.post("/api/student/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const studentData = insertStudentSchema.parse({
        ...req.body,
        id: req.user.id,
      });

      let student = await storage.getStudent(req.user.id);
      const cleanData = (data: any) => {
        const cleaned: any = {};
        for (const key in data) {
          cleaned[key] = data[key] === undefined ? null : data[key];
        }
        return cleaned;
      };

      if (student) {
        student = await storage.updateStudent(req.user.id, {
          ...cleanData(studentData),
          id: req.user.id,
          status: student.status,
          studentId: student.studentId,
        });
      } else {
        student = await storage.createStudent({
          ...cleanData(studentData),
          id: req.user.id,
          status: "not-enrolled",
        });
      }

      res.status(201).json(student);
    } catch (err) {
      console.error("Profile error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json(err);
      } else {
        res.status(500).send("Internal Server Error");
      }
    }
  });

  // Enrollment
  app.post("/api/student/enroll", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { academicYear, semester, subjectIds, yearLevel } = req.body;

      if (!subjectIds || subjectIds.length === 0) {
        return res.status(400).json({ message: "At least one subject is required for enrollment" });
      }

      // Check if student already has a pending enrollment
      const existingEnrollment = await storage.getStudentEnrollment(req.user.id);
      if (existingEnrollment && existingEnrollment.status === "pending") {
        return res.status(400).json({ message: "You already have a pending enrollment application" });
      }

      const enrollment = await storage.createEnrollment(req.user.id, { academicYear, semester, yearLevel }, subjectIds);
      res.status(201).json(enrollment);
    } catch (err: any) {
      console.error("Enrollment error:", err);
      res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  });

  app.get("/api/student/enrollment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const enrollment = await storage.getStudentEnrollment(req.user.id);
    res.json(enrollment);
  });

  // Admin Routes
  app.get("/api/admin/students", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const [students, total] = await Promise.all([
      storage.getStudents(limit, offset),
      storage.getTotalStudentsCount()
    ]);

    res.json({
      students,
      pagination: {
        total,
        limit,
        offset
      }
    });
  });

  app.post("/api/admin/notify", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    
    try {
      const { studentId, courseCode, message, type, subject } = req.body;
      
      if (courseCode) {
        const result = await notifyStudent(type as any, {
          courseCode,
          subject: subject || "Course-wide Notification",
          message
        });
        return res.json({ success: true, result });
      }

      const student = await storage.getStudent(studentId);
      if (!student) return res.status(404).send("Student not found");
      
      const result = await notifyStudent(type, {
        userId: student.id,
        toEmail: student.email || undefined,
        toPhone: student.mobileNumber || undefined,
        subject: subject || "Notification from ZDSPGC Enrollment System",
        message
      });
      
      // Log the notification in the record
      const status = (result.email || result.sms || result.realtime) ? "sent" : "failed";
      await storage.createNotification({
        studentId,
        message,
        type,
        status
      });
      
      res.json({
        success: true,
        sent: result
      });
    } catch (err) {
      console.error("[NOTIFY] Error processing notification:", err);
      res.status(500).send("Internal Server Error");
    }
  });

  app.patch("/api/admin/students/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const student = await storage.updateStudent(req.params.id, req.body);
      res.json(student);
    } catch (err) {
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/api/admin/enrollments", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const all = await storage.getAllDetailedEnrollments();
    res.json(all);
  });

  app.get("/api/admin/enrollments/pending", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const all = await storage.getAllDetailedEnrollments();
    const pending = all.filter(item => item.enrollment.status === "pending");
    res.json(pending);
  });

  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);

    try {
      const [totalStudents, enrollments, coursesList, enrollmentByCourse] = await Promise.all([
        storage.getTotalStudentsCount(),
        storage.getAllDetailedEnrollments(),
        storage.getAllCourses(),
        storage.getEnrollmentCountsByCourse()
      ]);

      console.log("[STATS] enrollmentByCourse:", JSON.stringify(enrollmentByCourse));

      res.json({
        totalStudents,
        pendingEnrollments: enrollments.filter(e => e.enrollment.status === "pending").length,
        activeCourses: coursesList.length,
        rejections: enrollments.filter(e => e.enrollment.status === "rejected").length,
        enrollmentByCourse
      });
    } catch (err) {
      console.error("[STATS] Error fetching stats:", err);
      res.status(500).json({ message: "Failed to load statistics", error: String(err) });
    }
  });

  app.patch("/api/admin/enrollments/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const { status, studentId, section, yearLevel } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).send("Invalid status");
    }
    try {
      const enrollment = await storage.updateEnrollmentStatus(
        req.params.id,
        status,
        studentId,
        section,
        yearLevel ? parseInt(yearLevel.toString(), 10) : undefined
      );
      res.json(enrollment);
    } catch (err) {
      res.status(500).send("Internal Server Error");
    }
  });

  // System Settings
  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (err) {
      console.error("Settings error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    try {
      const updated = await storage.updateSystemSettings(req.body);
      
      // Sync to .env if relevant fields are present
      const envUpdates: Record<string, string> = {};
      if (req.body.sendgridApiKey) envUpdates["SENDGRID_API_KEY"] = req.body.sendgridApiKey;
      if (req.body.sendgridFromEmail) envUpdates["SENDGRID_FROM_EMAIL"] = req.body.sendgridFromEmail;
      if (req.body.twilioSid) envUpdates["TWILIO_SID"] = req.body.twilioSid;
      if (req.body.twilioAuth) envUpdates["TWILIO_AUTH"] = req.body.twilioAuth;
      if (req.body.twilioPhone) envUpdates["TWILIO_PHONE"] = req.body.twilioPhone;
      
      if (Object.keys(envUpdates).length > 0) {
        syncToEnv(envUpdates);
      }
      
      // Auto-broadcast if enrollment is opened
      if (req.body.enrollmentStatus === "open") {
        broadcastToStudents("Enrollment is now open!");
      }
      
      res.json(updated);
    } catch (err) {
      console.error("Settings error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  return httpServer;
}

