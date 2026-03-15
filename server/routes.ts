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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  app.get("/api/courses", async (_req, res) => {
    const courses = await storage.getAllCourses();
    res.json(courses);
  });

  app.post("/api/courses", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const course = await storage.createCourse(req.body);
    res.status(201).json(course);
  });

  app.patch("/api/courses/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    const course = await storage.updateCourse(req.params.id, req.body);
    res.json(course);
  });

  app.delete("/api/courses/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== "admin") return res.sendStatus(403);
    await storage.deleteCourse(req.params.id);
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
        student = await storage.createStudent({
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
      const { academicYear, semester, subjectIds } = req.body;
      const enrollment = await storage.createEnrollment(req.user.id, { academicYear, semester }, subjectIds);
      res.status(201).json(enrollment);
    } catch (err) {
      res.status(500).send("Internal Server Error");
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
    const students = await storage.getAllStudents();
    res.json(students);
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
    const students = await storage.getAllStudents();
    const enrollments = await storage.getAllDetailedEnrollments();
    const coursesCount = (await storage.getAllCourses()).length;

    res.json({
      totalStudents: students.length,
      pendingEnrollments: enrollments.filter(e => e.enrollment.status === "pending").length,
      activeCourses: coursesCount,
      rejections: enrollments.filter(e => e.enrollment.status === "rejected").length,
    });
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

  return httpServer;
}

