import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, primaryKey, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
});

export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  units: integer("units").notNull().default(3),
  schedule: text("schedule"),
  instructor: text("instructor"),
  yearLevel: integer("year_level").notNull().default(1),
  semester: text("semester").notNull().default("1st"), // 1st, 2nd, Summer
  courseId: varchar("course_id").references(() => courses.id),
});

export const students = pgTable("students", {
  id: varchar("id").primaryKey().references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  extraName: text("extra_name"), // for Jr, III etc
  address: text("address"),
  dateOfBirth: text("date_of_birth"),
  placeOfBirth: text("place_of_birth"),
  gender: text("gender"),
  religion: text("religion"),
  nationality: text("nationality"),
  civilStatus: text("civil_status"),
  mobileNumber: text("mobile_number"),
  email: text("email"),
  
  // Parents
  fatherName: text("father_name"),
  fatherOccupation: text("father_occupation"),
  fatherContact: text("father_contact"),
  motherName: text("mother_name"),
  motherOccupation: text("mother_occupation"),
  motherContact: text("mother_contact"),
  
  // Guardian
  guardianName: text("guardian_name"),
  guardianRelationship: text("guardian_relationship"),
  guardianContact: text("guardian_contact"),
  
  // Education Background
  elementarySchool: text("elementary_school"),
  elementaryYear: text("elementary_year"),
  highSchool: text("high_school"),
  highSchoolYear: text("high_school_year"),
  seniorHighSchool: text("senior_high_school"),
  seniorHighSchoolYear: text("senior_high_school_year"),
  
  photoUrl: text("photo_url"),
  diplomaUrl: text("diploma_url"),
  form138Url: text("form138_url"),
  goodMoralUrl: text("good_moral_url"),
  psaUrl: text("psa_url"),
  studentId: text("student_id").unique(),
  courseId: varchar("course_id").references(() => courses.id),
  yearLevel: integer("year_level").default(1),
  section: text("section"),
  status: text("status").notNull().default("not-enrolled"),
}, (table) => [
  index("idx_student_id").on(table.studentId),
]);

export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id),
  academicYear: text("academic_year").notNull(),
  semester: text("semester").notNull(),
  registrationDate: timestamp("registration_date").defaultNow(),
  status: text("status").notNull().default("pending"),
  yearLevel: integer("year_level").notNull().default(1),
});

export const enrollmentSubjects = pgTable("enrollment_subjects", {
  enrollmentId: varchar("enrollment_id").references(() => enrollments.id),
  subjectId: varchar("subject_id").references(() => subjects.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.enrollmentId, t.subjectId] }),
}));

export const systemSettings = pgTable("system_settings", {
  id: integer("id").primaryKey().default(1),
  schoolName: text("school_name").notNull().default("ZDSPGC"),
  contactEmail: text("contact_email").notNull().default("info@zdspgc.edu.ph"),
  contactNumber: text("contact_number").notNull().default("+63 912 345 6789"),
  currentAcademicYear: text("current_academic_year").notNull().default("2025-2026"),
  currentSemester: text("current_semester").notNull().default("1st Semester"), // 1st Semester, 2nd Semester, Summer
  enrollmentStatus: text("enrollment_status").notNull().default("open"), // open, closed, maintenance
});

// Session table for connect-pg-simple
export const sessions = pgTable("session", {
    sid: varchar("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  registrationDate: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type EnrollmentSubject = typeof enrollmentSubjects.$inferSelect;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

