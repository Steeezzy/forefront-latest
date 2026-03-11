import { z } from 'zod';
export declare const trackVisitorSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    visitorId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    currentPage: z.ZodOptional<z.ZodString>;
    browser: z.ZodOptional<z.ZodString>;
    browserVersion: z.ZodOptional<z.ZodString>;
    os: z.ZodOptional<z.ZodString>;
    osVersion: z.ZodOptional<z.ZodString>;
    deviceType: z.ZodOptional<z.ZodString>;
    ipAddress: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    referrer: z.ZodOptional<z.ZodString>;
    utmSource: z.ZodOptional<z.ZodString>;
    utmMedium: z.ZodOptional<z.ZodString>;
    utmCampaign: z.ZodOptional<z.ZodString>;
    customProperties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const trackPageViewSchema: z.ZodObject<{
    visitorId: z.ZodString;
    pageUrl: z.ZodString;
    pageTitle: z.ZodOptional<z.ZodString>;
    referrer: z.ZodOptional<z.ZodString>;
    durationSeconds: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare class VisitorService {
    trackVisitor(data: z.infer<typeof trackVisitorSchema>): Promise<any>;
    trackPageView(data: z.infer<typeof trackPageViewSchema>): Promise<any>;
    setVisitorOffline(visitorId: string): Promise<void>;
    getVisitorById(visitorId: string, workspaceId: string): Promise<any>;
    getVisitors(workspaceId: string, options?: {
        online?: boolean;
        page?: number;
        limit?: number;
    }): Promise<any[]>;
    getOnlineVisitorsCount(workspaceId: string): Promise<number>;
}
export declare const visitorService: VisitorService;
//# sourceMappingURL=visitor.service.d.ts.map