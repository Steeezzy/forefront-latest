import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgres://postgres:password@localhost:5433/questron' });

async function main() {
    const result = await pool.query('SELECT id, name, trigger_type, is_active FROM flows LIMIT 10');
    console.log('Flows:', result.rows);
    
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%flow%'");
    console.log('Flow tables:', tables.rows.map(r => r.table_name));
    
    const agents = await pool.query('SELECT id, name FROM agents LIMIT 3');
    console.log('Agents:', agents.rows);
    
    await pool.end();
}

main().catch(console.error);
