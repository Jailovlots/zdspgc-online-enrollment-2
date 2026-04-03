import pkg from 'pg';
const { Pool } = pkg;
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrateStudents() {
  const client = await pool.connect();
  try {
    console.log("Starting final student manual migration...");
    
    await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS student_id text UNIQUE,
      ADD COLUMN IF NOT EXISTS section text,
      ADD COLUMN IF NOT EXISTS year_level integer DEFAULT 1,
      ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'not-enrolled',
      ADD COLUMN IF NOT EXISTS course_id varchar REFERENCES courses(id);
    `);
    
    // Also, checking the enrollments table to ensure it has year_level
    await client.query(`
      ALTER TABLE enrollments
      ADD COLUMN IF NOT EXISTS year_level integer NOT NULL DEFAULT 1;
    `);

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateStudents();
