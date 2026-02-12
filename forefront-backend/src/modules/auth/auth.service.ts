import { pool, query } from '../../config/db.js';
import { hashPassword, verifyPassword } from '../../utils/hash.js';
import { signToken } from '../../utils/jwt.js';
import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    workspaceName: z.string().min(1).default('My Workspace'),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export class AuthService {
    async register(data: z.infer<typeof registerSchema>) {
        console.log('AuthService: Starting registration');
        const client = await pool.connect();
        console.log('AuthService: DB Client connected');

        try {
            await client.query('BEGIN');
            console.log('AuthService: Transaction started');

            // 1. Check if user exists
            const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [data.email]);
            if (existingUser.rows.length > 0) {
                throw new Error('User already exists');
            }

            // 2. Create User
            const passwordHash = await hashPassword(data.password);
            const userRes = await client.query(
                'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
                [data.email, passwordHash]
            );
            const user = userRes.rows[0];

            // 3. Create Workspace
            const workspaceRes = await client.query(
                'INSERT INTO workspaces (name, owner_id) VALUES ($1, $2) RETURNING id, name',
                [data.workspaceName, user.id]
            );
            const workspace = workspaceRes.rows[0];

            await client.query('COMMIT');

            // 4. Generate Token
            const token = signToken({ userId: user.id, workspaceId: workspace.id });

            return { user, workspace, token };

        } catch (e) {
            console.error('AuthService: Registration failed', e);
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async login(data: z.infer<typeof loginSchema>) {
        // 1. Find User
        const res = await query('SELECT * FROM users WHERE email = $1', [data.email]);
        if (res.rows.length === 0) {
            throw new Error('Invalid credentials');
        }
        const user = res.rows[0];

        // 2. Verify Password
        const isValid = await verifyPassword(data.password, user.password_hash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        // 3. Find Workspace (simplified: explicit owner or member logic later)
        const workspaceRes = await query('SELECT id, name FROM workspaces WHERE owner_id = $1 LIMIT 1', [user.id]);
        const workspace = workspaceRes.rows[0];

        if (!workspace) {
            throw new Error('No workspace found for user');
        }

        // 4. Generate Token
        const token = signToken({ userId: user.id, workspaceId: workspace.id });

        return {
            user: { id: user.id, email: user.email },
            workspace,
            token
        };
    }
    async getUserById(userId: string) {
        const res = await query('SELECT * FROM users WHERE id = $1', [userId]);
        return res.rows[0];
    }
}
