import pkg from 'pg';
const { Pool } = pkg;
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting migration for subjects table...");
    
    await client.query(`
      ALTER TABLE subjects 
      ADD COLUMN IF NOT EXISTS year_level integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS semester text NOT NULL DEFAULT '1st',
      ADD COLUMN IF NOT EXISTS course_id varchar REFERENCES courses(id);
    `);
    
    console.log("Migration completed successfully: year_level, semester, course_id added to subjects.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
