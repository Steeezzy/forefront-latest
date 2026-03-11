import { pool, query } from '../../config/db.js';
import { z } from 'zod';
import * as crypto from 'crypto';
// Default permissions by role
const DEFAULT_PERMISSIONS = {
    admin: {
        canViewChats: true,
        canRespondChats: true,
        canManageFlows: true,
        canManageKnowledge: true,
        canManageSettings: true,
        canManageBilling: true,
        canManageTeam: true,
    },
    operator: {
        canViewChats: true,
        canRespondChats: true,
        canManageFlows: false,
        canManageKnowledge: false,
        canManageSettings: false,
        canManageBilling: false,
        canManageTeam: false,
    },
    viewer: {
        canViewChats: true,
        canRespondChats: false,
        canManageFlows: false,
        canManageKnowledge: false,
        canManageSettings: false,
        canManageBilling: false,
        canManageTeam: false,
    },
};
export const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'operator', 'viewer']).default('operator'),
    permissions: z.object({
        canViewChats: z.boolean().optional(),
        canRespondChats: z.boolean().optional(),
        canManageFlows: z.boolean().optional(),
        canManageKnowledge: z.boolean().optional(),
        canManageSettings: z.boolean().optional(),
        canManageBilling: z.boolean().optional(),
        canManageTeam: z.boolean().optional(),
    }).optional(),
});
export const updateMemberSchema = z.object({
    role: z.enum(['admin', 'operator', 'viewer']).optional(),
    permissions: z.object({
        canViewChats: z.boolean().optional(),
        canRespondChats: z.boolean().optional(),
        canManageFlows: z.boolean().optional(),
        canManageKnowledge: z.boolean().optional(),
        canManageSettings: z.boolean().optional(),
        canManageBilling: z.boolean().optional(),
        canManageTeam: z.boolean().optional(),
    }).optional(),
    status: z.enum(['active', 'deactivated']).optional(),
});
export class TeamService {
    async inviteMember(workspaceId, invitedBy, data) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Check if user already exists
            const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [data.email]);
            let userId = null;
            if (existingUser.rows.length > 0) {
                userId = existingUser.rows[0].id;
                // Check if already a member
                const existingMember = await client.query('SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2', [workspaceId, userId]);
                if (existingMember.rows.length > 0) {
                    throw new Error('User is already a member of this workspace');
                }
            }
            // Generate invite token
            const inviteToken = crypto.randomBytes(32).toString('hex');
            const permissions = data.permissions || DEFAULT_PERMISSIONS[data.role];
            // Create member record (pending)
            const memberRes = await client.query(`INSERT INTO workspace_members 
         (workspace_id, user_id, role, permissions, invited_by, invited_at, status)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'pending')
         RETURNING *`, [workspaceId, userId, data.role, JSON.stringify(permissions), invitedBy]);
            // Store invite token (we'll create a simple invites table or use metadata)
            // For now, we'll add it to the workspace_members record
            await client.query('UPDATE workspace_members SET metadata = $1 WHERE id = $2', [JSON.stringify({ inviteToken, email: data.email }), memberRes.rows[0].id]);
            await client.query('COMMIT');
            // TODO: Send invite email
            console.log(`Invite token for ${data.email}: ${inviteToken}`);
            return {
                member: memberRes.rows[0],
                inviteToken,
                inviteUrl: `/accept-invite?token=${inviteToken}`,
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async acceptInvite(token, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Find member by token
            const memberRes = await client.query(`SELECT * FROM workspace_members 
         WHERE metadata->>'inviteToken' = $1 AND status = 'pending'`, [token]);
            if (memberRes.rows.length === 0) {
                throw new Error('Invalid or expired invite token');
            }
            const member = memberRes.rows[0];
            // Update member
            const updatedRes = await client.query(`UPDATE workspace_members 
         SET user_id = $1, status = 'active', accepted_at = CURRENT_TIMESTAMP, metadata = '{}'
         WHERE id = $2
         RETURNING *`, [userId, member.id]);
            await client.query('COMMIT');
            return updatedRes.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getWorkspaceMembers(workspaceId) {
        const result = await query(`SELECT 
        wm.*,
        u.email as user_email,
        u.name as user_name,
        u.avatar_url as user_avatar,
        inviter.email as invited_by_email,
        inviter.name as invited_by_name
       FROM workspace_members wm
       LEFT JOIN users u ON wm.user_id = u.id
       LEFT JOIN users inviter ON wm.invited_by = inviter.id
       WHERE wm.workspace_id = $1
       ORDER BY wm.created_at DESC`, [workspaceId]);
        return result.rows;
    }
    async updateMember(workspaceId, memberId, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.role) {
            updates.push(`role = $${paramIndex}`);
            values.push(data.role);
            paramIndex++;
            // Update permissions to default for new role if not explicitly provided
            if (!data.permissions) {
                updates.push(`permissions = $${paramIndex}`);
                values.push(JSON.stringify(DEFAULT_PERMISSIONS[data.role]));
                paramIndex++;
            }
        }
        if (data.permissions) {
            updates.push(`permissions = $${paramIndex}`);
            values.push(JSON.stringify(data.permissions));
            paramIndex++;
        }
        if (data.status) {
            updates.push(`status = $${paramIndex}`);
            values.push(data.status);
            paramIndex++;
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(workspaceId);
        values.push(memberId);
        const result = await query(`UPDATE workspace_members 
       SET ${updates.join(', ')}
       WHERE workspace_id = $${paramIndex} AND id = $${paramIndex + 1}
       RETURNING *`, values);
        if (result.rows.length === 0) {
            throw new Error('Member not found');
        }
        return result.rows[0];
    }
    async removeMember(workspaceId, memberId) {
        const result = await query('DELETE FROM workspace_members WHERE workspace_id = $1 AND id = $2 RETURNING *', [workspaceId, memberId]);
        if (result.rows.length === 0) {
            throw new Error('Member not found');
        }
        return result.rows[0];
    }
    async getUserPermissions(workspaceId, userId) {
        const result = await query('SELECT role, permissions FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND status = $3', [workspaceId, userId, 'active']);
        if (result.rows.length === 0) {
            // Check if user is workspace owner
            const ownerResult = await query('SELECT id FROM workspaces WHERE id = $1 AND owner_id = $2', [workspaceId, userId]);
            if (ownerResult.rows.length > 0) {
                return DEFAULT_PERMISSIONS.admin;
            }
            throw new Error('User is not a member of this workspace');
        }
        const member = result.rows[0];
        return { ...DEFAULT_PERMISSIONS[member.role], ...member.permissions };
    }
    async checkPermission(workspaceId, userId, permission) {
        const permissions = await this.getUserPermissions(workspaceId, userId);
        return permissions[permission] || false;
    }
}
export const teamService = new TeamService();
//# sourceMappingURL=team.service.js.map