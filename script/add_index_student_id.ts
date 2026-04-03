import pkg from 'pg';
const { Pool } = pkg;
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined in .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Adding index idx_student_id to students(student_id)...");
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_student_id ON students(student_id);
    `);
    
    console.log("Index created successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
