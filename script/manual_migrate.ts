import pkg from 'pg';
const { Pool } = pkg;
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting manual migration...");
    
    await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS middle_name text,
      ADD COLUMN IF NOT EXISTS extra_name text,
      ADD COLUMN IF NOT EXISTS place_of_birth text,
      ADD COLUMN IF NOT EXISTS gender text,
      ADD COLUMN IF NOT EXISTS religion text,
      ADD COLUMN IF NOT EXISTS nationality text,
      ADD COLUMN IF NOT EXISTS civil_status text,
      ADD COLUMN IF NOT EXISTS email text,
      ADD COLUMN IF NOT EXISTS father_name text,
      ADD COLUMN IF NOT EXISTS father_occupation text,
      ADD COLUMN IF NOT EXISTS father_contact text,
      ADD COLUMN IF NOT EXISTS mother_name text,
      ADD COLUMN IF NOT EXISTS mother_occupation text,
      ADD COLUMN IF NOT EXISTS mother_contact text,
      ADD COLUMN IF NOT EXISTS guardian_name text,
      ADD COLUMN IF NOT EXISTS guardian_relationship text,
      ADD COLUMN IF NOT EXISTS guardian_contact text,
      ADD COLUMN IF NOT EXISTS elementary_school text,
      ADD COLUMN IF NOT EXISTS elementary_year text,
      ADD COLUMN IF NOT EXISTS high_school text,
      ADD COLUMN IF NOT EXISTS high_school_year text,
      ADD COLUMN IF NOT EXISTS senior_high_school text,
      ADD COLUMN IF NOT EXISTS senior_high_school_year text,
      ADD COLUMN IF NOT EXISTS photo_url text;
    `);
    
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
