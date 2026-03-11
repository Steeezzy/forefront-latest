import { z } from 'zod';
export interface Permissions {
    canViewChats: boolean;
    canRespondChats: boolean;
    canManageFlows: boolean;
    canManageKnowledge: boolean;
    canManageSettings: boolean;
    canManageBilling: boolean;
    canManageTeam: boolean;
}
export declare const inviteSchema: z.ZodObject<{
    email: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        operator: "operator";
        admin: "admin";
        viewer: "viewer";
    }>>;
    permissions: z.ZodOptional<z.ZodObject<{
        canViewChats: z.ZodOptional<z.ZodBoolean>;
        canRespondChats: z.ZodOptional<z.ZodBoolean>;
        canManageFlows: z.ZodOptional<z.ZodBoolean>;
        canManageKnowledge: z.ZodOptional<z.ZodBoolean>;
        canManageSettings: z.ZodOptional<z.ZodBoolean>;
        canManageBilling: z.ZodOptional<z.ZodBoolean>;
        canManageTeam: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const updateMemberSchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<{
        operator: "operator";
        admin: "admin";
        viewer: "viewer";
    }>>;
    permissions: z.ZodOptional<z.ZodObject<{
        canViewChats: z.ZodOptional<z.ZodBoolean>;
        canRespondChats: z.ZodOptional<z.ZodBoolean>;
        canManageFlows: z.ZodOptional<z.ZodBoolean>;
        canManageKnowledge: z.ZodOptional<z.ZodBoolean>;
        canManageSettings: z.ZodOptional<z.ZodBoolean>;
        canManageBilling: z.ZodOptional<z.ZodBoolean>;
        canManageTeam: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        deactivated: "deactivated";
    }>>;
}, z.core.$strip>;
export declare class TeamService {
    inviteMember(workspaceId: string, invitedBy: string, data: z.infer<typeof inviteSchema>): Promise<{
        member: any;
        inviteToken: string;
        inviteUrl: string;
    }>;
    acceptInvite(token: string, userId: string): Promise<any>;
    getWorkspaceMembers(workspaceId: string): Promise<any[]>;
    updateMember(workspaceId: string, memberId: string, data: z.infer<typeof updateMemberSchema>): Promise<any>;
    removeMember(workspaceId: string, memberId: string): Promise<any>;
    getUserPermissions(workspaceId: string, userId: string): Promise<Permissions>;
    checkPermission(workspaceId: string, userId: string, permission: keyof Permissions): Promise<boolean>;
}
export declare const teamService: TeamService;
//# sourceMappingURL=team.service.d.ts.map