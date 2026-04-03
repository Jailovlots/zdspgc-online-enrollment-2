import { users, students, courses, subjects, enrollments, enrollmentSubjects, type User, type InsertUser, type Student, type Course, type Subject, type Enrollment } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  
  // Student operations
  getStudent(id: string): Promise<Student | undefined>;
  getStudentProfile(userId: string): Promise<any | undefined>;
  createStudent(student: Student): Promise<Student>;
  updateStudent(id: string, student: any): Promise<Student>;
  getAllStudents(): Promise<any[]>;
  
  updateCourse(id: string, course: any): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  updateSubject(id: string, subject: any): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;
  
  // Enrollment operations
  createEnrollment(studentId: string, enrollmentData: any, subjectIds: string[]): Promise<Enrollment>;
  getStudentEnrollment(studentId: string): Promise<any | undefined>;
  getPendingEnrollments(): Promise<any[]>;
  getAllDetailedEnrollments(): Promise<any[]>;
  updateEnrollmentStatus(enrollmentId: string, status: string, studentId?: string, section?: string, yearLevel?: number): Promise<Enrollment>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentProfile(userId: string): Promise<any | undefined> {
    const [profile] = await db
      .select({
        student: students,
        user: users,
        course: courses,
      })
      .from(students)
      .innerJoin(users, eq(students.id, users.id))
      .leftJoin(courses, eq(students.courseId, courses.id))
      .where(eq(students.id, userId));
    return profile;
  }

  async createStudent(student: Student): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: string, studentData: any): Promise<Student> {
    const [updatedStudent] = await db.update(students).set(studentData).where(eq(students.id, id)).returning();
    return updatedStudent;
  }

  async getAllStudents(): Promise<any[]> {
    const all = await db
      .select({
        student: students,
        course: courses.code,
      })
      .from(students)
      .leftJoin(courses, eq(students.courseId, courses.id));

    return all.map(item => ({
      ...item.student,
      course: item.course
    }));
  }

  async getAllCourses(): Promise<Course[]> {
    return db.select().from(courses);
  }

  async getSubjectsByCourse(courseId: string): Promise<Subject[]> {
    return db.select().from(subjects).where(eq(subjects.courseId, courseId));
  }

  async createCourse(course: any): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async createSubject(subject: any): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  async updateCourse(id: string, courseData: any): Promise<Course> {
    const [updatedCourse] = await db.update(courses).set(courseData).where(eq(courses.id, id)).returning();
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async updateSubject(id: string, subjectData: any): Promise<Subject> {
    const [updatedSubject] = await db.update(subjects).set(subjectData).where(eq(subjects.id, id)).returning();
    return updatedSubject;
  }

  async deleteSubject(id: string): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  async createEnrollment(studentId: string, enrollmentData: any, subjectIds: string[]): Promise<Enrollment> {
    return await db.transaction(async (tx) => {
      const [enrollment] = await tx.insert(enrollments).values({
        studentId,
        academicYear: enrollmentData.academicYear,
        semester: enrollmentData.semester,
        yearLevel: enrollmentData.yearLevel || 1,
        status: "pending",
      }).returning();

      for (const subjectId of subjectIds) {
        await tx.insert(enrollmentSubjects).values({
          enrollmentId: enrollment.id,
          subjectId,
        });
      }

      await tx.update(students).set({ status: "pending" }).where(eq(students.id, studentId));
      
      return enrollment;
    });
  }

  async getStudentEnrollment(studentId: string): Promise<any | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
    if (!enrollment) return undefined;

    const subjectsList = await db
      .select({
        subject: subjects,
      })
      .from(enrollmentSubjects)
      .innerJoin(subjects, eq(enrollmentSubjects.subjectId, subjects.id))
      .where(eq(enrollmentSubjects.enrollmentId, enrollment.id));

    return { ...enrollment, subjects: subjectsList.map(s => s.subject) };
  }

  async getPendingEnrollments(): Promise<any[]> {
    return db
      .select({
        enrollment: enrollments,
        student: students,
        course: courses.code,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(courses, eq(students.courseId, courses.id))
      .where(eq(enrollments.status, "pending"));
  }

  async getAllDetailedEnrollments(): Promise<any[]> {
    const allEnrollments = await db
      .select({
        enrollment: enrollments,
        student: students,
        course: courses.code,
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(courses, eq(students.courseId, courses.id));

    // Get subjects for each enrollment
    const detailed = await Promise.all(allEnrollments.map(async (item) => {
      const subjectsList = await db
        .select({ subject: subjects })
        .from(enrollmentSubjects)
        .innerJoin(subjects, eq(enrollmentSubjects.subjectId, subjects.id))
        .where(eq(enrollmentSubjects.enrollmentId, item.enrollment.id));
      
      return { 
        ...item, 
        subjects: subjectsList.map(s => s.subject) 
      };
    }));

    return detailed;
  }

  async updateEnrollmentStatus(enrollmentId: string, status: string, studentId?: string, section?: string, yearLevel?: number): Promise<Enrollment> {
    return await db.transaction(async (tx) => {
      const updateData: any = { status };
      if (yearLevel !== undefined) updateData.yearLevel = yearLevel;

      const [enrollment] = await tx
        .update(enrollments)
        .set(updateData)
        .where(eq(enrollments.id, enrollmentId))
        .returning();

      if (enrollment && enrollment.studentId) {
        const studentUpdate: any = { 
          status: status === "approved" ? "enrolled" : "rejected" 
        };
        
        if (status === "approved") {
          if (studentId) studentUpdate.studentId = studentId;
          if (section) studentUpdate.section = section;
          // Use yearLevel from enrollment if provided, otherwise fallback to existing
          if (yearLevel !== undefined) studentUpdate.yearLevel = yearLevel;
          else if (enrollment.yearLevel) studentUpdate.yearLevel = enrollment.yearLevel;
        }

        await tx
          .update(students)
          .set(studentUpdate)
          .where(eq(students.id, enrollment.studentId as string));
      }

      return enrollment;
    });
  }
}

export const storage = new DatabaseStorage();

