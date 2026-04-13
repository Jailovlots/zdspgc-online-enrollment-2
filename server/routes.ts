import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { insertStudentSchema, insertEnrollmentSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import fs from "fs";
import NodeCache from "node-cache";
import { notifyStudent } from "./lib/notifications";
import { broadcastToStudents, sendRealTimeMessage, broadcastToStaff } from "./lib/socket";

// Initialize Cache (node-cache)
const myCache = new NodeCache({ stdTTL: 300 }); // 5 minutes default TTL

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dnjy7glul",
  api_key: process.env.CLOUDINARY_API_KEY || "417512989715619",
  api_secret: process.env.CLOUDINARY_API_SECRET || "c5QGhpCKhpvgsFLDvo0nF7q9940",
});

const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "enrollment_uploads",
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
  } as any,
});

const upload = multer({
  storage: cloudStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Increase to 10MB since cloud handles it well
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

  // Helper middleware for RBAC
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).send("Forbidden: Administrative Office Only");
    }
    next();
  };

  const isStaff = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "officer")) {
      return res.status(403).send("Forbidden: Staff Only");
    }
    next();
  };

  // Static serving for uploads using absolute project root
  const uploadsPath = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`[SERVER] Created uploads directory at: ${uploadsPath}`);
  }
  app.use("/uploads", express.static(uploadsPath));
  console.log(`[SERVER] Serving static uploads from: ${uploadsPath}`);

  // File Upload Route
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    // multer-storage-cloudinary provides the secure_url in req.file.path
    res.json({ url: (req.file as any).path });
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

  app.post("/api/courses", isStaff, async (req, res) => {
    const course = await storage.createCourse(req.body);
    myCache.set("courses", JSON.stringify(await storage.getAllCourses()));
    res.status(201).json(course);
  });

  app.patch("/api/courses/:id", isStaff, async (req, res) => {
    const course = await storage.updateCourse(req.params.id, req.body);
    myCache.set("courses", JSON.stringify(await storage.getAllCourses()));
    res.json(course);
  });

  app.delete("/api/courses/:id", isStaff, async (req, res) => {
    await storage.deleteCourse(req.params.id);
    myCache.set("courses", JSON.stringify(await storage.getAllCourses()));
    res.sendStatus(204);
  });

  app.get("/api/courses/:courseId/subjects", async (req, res) => {
    const subjects = await storage.getSubjectsByCourse(req.params.courseId);
    res.json(subjects);
  });

  app.post("/api/subjects", isStaff, async (req, res) => {
    const subject = await storage.createSubject(req.body);
    res.status(201).json(subject);
  });

  app.patch("/api/subjects/:id", isStaff, async (req, res) => {
    const subject = await storage.updateSubject(req.params.id, req.body);
    res.json(subject);
  });

  app.delete("/api/subjects/:id", isStaff, async (req, res) => {
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
      
      // Notify staff/admin of new enrollment
      broadcastToStaff({
        type: "new-enrollment",
        studentName: `${req.user.username}`,
        message: `New enrollment application submitted by ${req.user.username}`
      });

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

  // Student Notifications
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const notifications = await storage.getNotificationsByStudent(req.user.id);
    res.json(notifications);
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const count = await storage.getUnreadNotificationCount(req.user.id);
    res.json({ count });
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.markNotificationAsRead(req.params.id);
    res.sendStatus(204);
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.markAllNotificationsAsRead(req.user.id);
    res.sendStatus(204);
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteNotification(req.params.id);
    res.sendStatus(204);
  });

  // Admin Routes
  app.get("/api/admin/students", isStaff, async (req, res) => {

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

  app.post("/api/admin/notify", isStaff, async (req, res) => {
    console.log(`[NOTIFY] Payload:`, JSON.stringify(req.body));
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
        subject: subject || "Notification",
        message
      });
      
      // Log the notification in the record
      const status = (result.email || result.sms || result.realtime || result.portal) ? "sent" : "failed";
      await storage.createNotification({
        studentId,
        title: subject || "Notification",
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

  app.patch("/api/admin/students/:id", isStaff, async (req, res) => {
    try {
      const student = await storage.updateStudent(req.params.id, req.body);
      
      // Notify the specific student in real-time so their dashboard refreshes
      if (student && student.id) {
        sendRealTimeMessage(student.id, {
          type: "profile-updated",
          studentId: student.studentId || null,
        });
      }
      
      res.json(student);
    } catch (err) {
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/api/admin/enrollments", isStaff, async (req, res) => {
    const all = await storage.getAllDetailedEnrollments();
    res.json(all);
  });

  app.get("/api/admin/enrollments/pending", isStaff, async (req, res) => {
    const all = await storage.getAllDetailedEnrollments();
    const pending = all.filter(item => item.enrollment.status === "pending");
    res.json(pending);
  });

  app.get("/api/admin/stats", isStaff, async (req, res) => {

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

  app.patch("/api/admin/enrollments/:id/status", isAdmin, async (req, res) => {
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

      // Notify the specific student in real-time so their dashboard refreshes
      if (enrollment && enrollment.studentId) {
        sendRealTimeMessage(enrollment.studentId, {
          type: "profile-updated",
          status,
          studentId: studentId || null,
        });
      }

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

  app.post("/api/settings", isAdmin, async (req, res) => {
    try {
      // Filter out null or undefined values from req.body to prevent DB constraint errors
      const cleanData: any = {};
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== null && req.body[key] !== undefined && req.body[key] !== "") {
          cleanData[key] = req.body[key];
        }
      });

      const updated = await storage.updateSystemSettings(cleanData);
      
      // Sync to .env if relevant fields are present
      const envUpdates: Record<string, string> = {};
      if (cleanData.sendgridApiKey) envUpdates["SENDGRID_API_KEY"] = cleanData.sendgridApiKey;
      if (cleanData.sendgridFromEmail) envUpdates["SENDGRID_FROM_EMAIL"] = cleanData.sendgridFromEmail;
      if (cleanData.twilioSid) envUpdates["TWILIO_SID"] = cleanData.twilioSid;
      if (cleanData.twilioAuth) envUpdates["TWILIO_AUTH"] = cleanData.twilioAuth;
      if (cleanData.twilioPhone) envUpdates["TWILIO_PHONE"] = cleanData.twilioPhone;
      
      if (Object.keys(envUpdates).length > 0) {
        syncToEnv(envUpdates);
      }

      // Broadcast changes to all clients so dashboards refresh immediately
      broadcastToStudents({
        type: "settings-updated",
        settings: updated
      });
      
      // Auto-broadcast if enrollment is opened
      if (cleanData.enrollmentStatus === "open") {
        broadcastToStudents("Enrollment is now open!");
      }
      
      res.json(updated);
    } catch (err) {
      console.error("Settings error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Officer Management
  app.get("/api/admin/officers", isAdmin, async (_req, res) => {
    try {
      const officers = await storage.getOfficers();
      res.json(officers);
    } catch (err) {
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/api/admin/officers", isAdmin, async (req, res) => {
    try {
      const parsed = insertUserSchema.parse({
        ...req.body,
        role: "officer",
      });

      const existingUser = await storage.getUserByUsername(parsed.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await hashPassword(parsed.password);
      const user = await storage.createUser({
        ...parsed,
        password: hashedPassword,
      });

      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json(err);
      } else {
        res.status(500).send("Internal Server Error");
      }
    }
  });

  app.delete("/api/admin/officers/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).send("Internal Server Error");
    }
  });

  return httpServer;
}

