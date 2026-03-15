CREATE TABLE "courses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "enrollment_subjects" (
	"enrollment_id" varchar,
	"subject_id" varchar,
	CONSTRAINT "enrollment_subjects_enrollment_id_subject_id_pk" PRIMARY KEY("enrollment_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar,
	"academic_year" text NOT NULL,
	"semester" text NOT NULL,
	"registration_date" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" varchar PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_name" text,
	"extra_name" text,
	"address" text,
	"date_of_birth" text,
	"place_of_birth" text,
	"gender" text,
	"religion" text,
	"nationality" text,
	"civil_status" text,
	"mobile_number" text,
	"email" text,
	"father_name" text,
	"father_occupation" text,
	"father_contact" text,
	"mother_name" text,
	"mother_occupation" text,
	"mother_contact" text,
	"guardian_name" text,
	"guardian_relationship" text,
	"guardian_contact" text,
	"elementary_school" text,
	"elementary_year" text,
	"high_school" text,
	"high_school_year" text,
	"senior_high_school" text,
	"senior_high_school_year" text,
	"photo_url" text,
	"student_id" text,
	"course_id" varchar,
	"year_level" integer DEFAULT 1,
	"status" text DEFAULT 'not-enrolled' NOT NULL,
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"units" integer DEFAULT 3 NOT NULL,
	"schedule" text,
	"instructor" text,
	"course_id" varchar,
	CONSTRAINT "subjects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "enrollment_subjects" ADD CONSTRAINT "enrollment_subjects_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_subjects" ADD CONSTRAINT "enrollment_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;