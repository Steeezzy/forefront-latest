
import { pool } from '../src/config/db';

async function checkUsers() {
    try {
        const res = await pool.query('SELECT id, email, created_at FROM users');
        console.log('User count:', res.rows.length);
        console.log('Users:', res.rows);
    } catch (e) {
        console.error('Error checking users:', e);
    } finally {
        await pool.end();
    }
}

checkUsers();
