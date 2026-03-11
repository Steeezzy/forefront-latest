/**
 * EmailChannelService — IMAP/SMTP + Gmail OAuth email integration.
 *
 * Handles:
 * - Gmail OAuth connection (authorization URL, callback, token refresh)
 * - IMAP polling for new emails (per-workspace, on interval)
 * - SMTP outbound sending (reply-in-thread)
 * - Parsing inbound emails into unified conversation format
 * - Threading via In-Reply-To / References headers
 *
 * For MVP, we support:
 * 1. Gmail via OAuth2 (recommended)
 * 2. Generic SMTP/IMAP via credentials
 */
interface EmailConnection {
    id: string;
    workspace_id: string;
    email_address: string;
    provider: 'gmail' | 'smtp_imap' | 'outlook';
    oauth_access_token?: string;
    oauth_refresh_token?: string;
    oauth_token_expires_at?: Date;
    imap_host?: string;
    imap_port?: number;
    smtp_host?: string;
    smtp_port?: number;
    username?: string;
    password?: string;
    use_ssl: boolean;
    last_uid?: string;
    is_active: boolean;
}
interface ParsedEmail {
    from: string;
    from_name?: string;
    to: string;
    subject: string;
    text_body: string;
    html_body?: string;
    message_id: string;
    in_reply_to?: string;
    references?: string;
    date: Date;
}
export declare class EmailChannelService {
    private pollingIntervals;
    /**
     * Generate Gmail OAuth authorization URL
     */
    getGmailAuthUrl(workspaceId: string): string;
    /**
     * Handle OAuth callback — exchange code for tokens
     */
    handleGmailCallback(code: string, state: string): Promise<EmailConnection>;
    /**
     * Refresh Gmail OAuth token
     */
    refreshGmailToken(connection: EmailConnection): Promise<string>;
    /**
     * Get valid access token (refresh if expired)
     */
    getValidAccessToken(connection: EmailConnection): Promise<string>;
    /**
     * Save an SMTP/IMAP email connection
     */
    connectSmtpImap(params: {
        workspaceId: string;
        emailAddress: string;
        imapHost: string;
        imapPort: number;
        smtpHost: string;
        smtpPort: number;
        username: string;
        password: string;
        useSsl: boolean;
    }): Promise<EmailConnection>;
    /**
     * Fetch new emails via Gmail API
     */
    pollGmail(connection: EmailConnection): Promise<void>;
    /**
     * Parse a Gmail API message into our standard format
     */
    private parseGmailMessage;
    /**
     * Recursively extract text/plain body from Gmail payload
     */
    private extractGmailBody;
    /**
     * Process an inbound email — find/create conversation, trigger auto-reply
     */
    processInboundEmail(connection: EmailConnection, email: ParsedEmail): Promise<void>;
    /**
     * Create a new email conversation
     */
    private createEmailConversation;
    /**
     * Send a reply to an email conversation
     */
    sendReply(conversationId: string, replyText: string): Promise<void>;
    /**
     * Send a reply via Gmail API
     */
    private sendGmailReply;
    /**
     * Start polling for all active email connections
     */
    startPolling(): Promise<void>;
    /**
     * Start polling for a specific connection
     */
    startPollingForConnection(connection: EmailConnection): void;
    /**
     * Stop polling for a specific connection
     */
    stopPolling(connectionId: string): void;
    /**
     * Stop all polling
     */
    stopAllPolling(): void;
    /**
     * Get all email connections for a workspace
     */
    getConnections(workspaceId: string): Promise<EmailConnection[]>;
    /**
     * Disconnect an email connection
     */
    disconnect(connectionId: string, workspaceId: string): Promise<void>;
}
export declare const emailChannelService: EmailChannelService;
export {};
//# sourceMappingURL=EmailChannelService.d.ts.map