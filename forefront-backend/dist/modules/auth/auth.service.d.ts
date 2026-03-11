import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    workspaceName: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare class AuthService {
    register(data: z.infer<typeof registerSchema>): Promise<{
        user: any;
        workspace: any;
        token: string;
    }>;
    login(data: z.infer<typeof loginSchema>): Promise<{
        user: {
            id: any;
            email: any;
        };
        workspace: any;
        token: string;
    }>;
    getUserById(userId: string): Promise<any>;
    syncClerkUser(clerkUserId: string, email: string, name?: string): Promise<{
        user: any;
        workspace: any;
        token: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map