
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function inspectSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'conversation_id'
    `);
    console.log('--- Schema for messages.conversation_id ---');
    console.table(res.rows);
    await pool.end();
  } catch (err) {
    console.error('Inspection failed:', err);
    process.exit(1);
  }
}

inspectSchema();
