import { z } from 'zod';
export declare const widgetConfigSchema: z.ZodObject<{
    primaryColor: z.ZodOptional<z.ZodString>;
    textColor: z.ZodOptional<z.ZodString>;
    backgroundColor: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodEnum<{
        "bottom-right": "bottom-right";
        "bottom-left": "bottom-left";
    }>>;
    offsetX: z.ZodOptional<z.ZodNumber>;
    offsetY: z.ZodOptional<z.ZodNumber>;
    bubbleIcon: z.ZodOptional<z.ZodString>;
    customIconUrl: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    welcomeMessage: z.ZodOptional<z.ZodString>;
    offlineMessage: z.ZodOptional<z.ZodString>;
    inputPlaceholder: z.ZodOptional<z.ZodString>;
    agentName: z.ZodOptional<z.ZodString>;
    agentTitle: z.ZodOptional<z.ZodString>;
    agentAvatarUrl: z.ZodOptional<z.ZodString>;
    autoOpenDelay: z.ZodOptional<z.ZodNumber>;
    showOnMobile: z.ZodOptional<z.ZodBoolean>;
    showAgentPhoto: z.ZodOptional<z.ZodBoolean>;
    showTypingIndicator: z.ZodOptional<z.ZodBoolean>;
    showFileUpload: z.ZodOptional<z.ZodBoolean>;
    showEmojiPicker: z.ZodOptional<z.ZodBoolean>;
    showBranding: z.ZodOptional<z.ZodBoolean>;
    collectEmailBeforeChat: z.ZodOptional<z.ZodBoolean>;
    soundEnabled: z.ZodOptional<z.ZodBoolean>;
    hiddenPages: z.ZodOptional<z.ZodArray<z.ZodString>>;
    defaultLanguage: z.ZodOptional<z.ZodString>;
    greetingRules: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, z.core.$strip>;
export declare class WidgetService {
    getWidgetConfig(workspaceId: string): Promise<any>;
    getPublicWidgetConfig(workspaceId: string): Promise<any>;
    updateWidgetConfig(workspaceId: string, data: z.infer<typeof widgetConfigSchema>): Promise<any>;
    private createDefaultConfig;
    private getDefaultPublicConfig;
    generateEmbedCode(workspaceId: string, host: string): string;
}
export declare const widgetService: WidgetService;
//# sourceMappingURL=widget.service.d.ts.map