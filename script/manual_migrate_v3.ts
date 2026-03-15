import pkg from 'pg';
const { Pool } = pkg;
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting manual migration for document fields...");
    
    await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS diploma_url text,
      ADD COLUMN IF NOT EXISTS form138_url text,
      ADD COLUMN IF NOT EXISTS good_moral_url text,
      ADD COLUMN IF NOT EXISTS psa_url text;
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
