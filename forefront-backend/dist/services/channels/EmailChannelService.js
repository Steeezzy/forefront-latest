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
import { pool } from '../../config/db.js';
import { autoReplyEngine } from './AutoReplyEngine.js';
import { env } from '../../config/env.js';
import { integrationEvents } from '../../modules/integrations/integration-events.service.js';
// ─── Service ───────────────────────────────────────────────────────────
export class EmailChannelService {
    pollingIntervals = new Map();
    // ─── Gmail OAuth ─────────────────────────────────────────────────
    /**
     * Generate Gmail OAuth authorization URL
     */
    getGmailAuthUrl(workspaceId) {
        const clientId = env.GOOGLE_CLIENT_ID || '';
        const redirectUri = `${env.BACKEND_URL || 'http://localhost:3001'}/api/channels/email/oauth/callback`;
        const state = Buffer.from(JSON.stringify({ workspaceId })).toString('base64');
        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' ');
        return `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(clientId)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&state=${encodeURIComponent(state)}` +
            `&access_type=offline` +
            `&prompt=consent`;
    }
    /**
     * Handle OAuth callback — exchange code for tokens
     */
    async handleGmailCallback(code, state) {
        const { workspaceId } = JSON.parse(Buffer.from(state, 'base64').toString());
        const clientId = env.GOOGLE_CLIENT_ID || '';
        const clientSecret = env.GOOGLE_CLIENT_SECRET || '';
        const redirectUri = `${env.BACKEND_URL || 'http://localhost:3001'}/api/channels/email/oauth/callback`;
        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });
        if (!tokenRes.ok) {
            const err = await tokenRes.text();
            throw new Error(`Gmail OAuth token exchange failed: ${err}`);
        }
        const tokens = await tokenRes.json();
        // Get user email
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        const emailAddress = userInfo.email;
        // Save connection
        const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
        const result = await pool.query(`INSERT INTO email_connections
       (workspace_id, email_address, provider, oauth_access_token, oauth_refresh_token, oauth_token_expires_at, use_ssl, is_active)
       VALUES ($1, $2, 'gmail', $3, $4, $5, true, true)
       ON CONFLICT (workspace_id, email_address) DO UPDATE SET
         oauth_access_token = $3, oauth_refresh_token = COALESCE($4, email_connections.oauth_refresh_token),
         oauth_token_expires_at = $5, is_active = true, updated_at = NOW()
       RETURNING *`, [workspaceId, emailAddress, tokens.access_token, tokens.refresh_token, expiresAt]);
        return result.rows[0];
    }
    /**
     * Refresh Gmail OAuth token
     */
    async refreshGmailToken(connection) {
        if (!connection.oauth_refresh_token) {
            throw new Error('No refresh token available');
        }
        const clientId = env.GOOGLE_CLIENT_ID || '';
        const clientSecret = env.GOOGLE_CLIENT_SECRET || '';
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: connection.oauth_refresh_token,
                grant_type: 'refresh_token',
            }),
        });
        if (!tokenRes.ok) {
            throw new Error('Failed to refresh Gmail token');
        }
        const tokens = await tokenRes.json();
        const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
        await pool.query(`UPDATE email_connections SET oauth_access_token = $1, oauth_token_expires_at = $2, updated_at = NOW()
       WHERE id = $3`, [tokens.access_token, expiresAt, connection.id]);
        return tokens.access_token;
    }
    /**
     * Get valid access token (refresh if expired)
     */
    async getValidAccessToken(connection) {
        if (connection.oauth_token_expires_at && new Date(connection.oauth_token_expires_at) > new Date()) {
            return connection.oauth_access_token;
        }
        return this.refreshGmailToken(connection);
    }
    // ─── SMTP/IMAP Connection ───────────────────────────────────────
    /**
     * Save an SMTP/IMAP email connection
     */
    async connectSmtpImap(params) {
        const result = await pool.query(`INSERT INTO email_connections
       (workspace_id, email_address, provider, imap_host, imap_port, smtp_host, smtp_port, username, password, use_ssl, is_active)
       VALUES ($1, $2, 'smtp_imap', $3, $4, $5, $6, $7, $8, $9, true)
       ON CONFLICT (workspace_id, email_address) DO UPDATE SET
         imap_host = $3, imap_port = $4, smtp_host = $5, smtp_port = $6,
         username = $7, password = $8, use_ssl = $9, is_active = true, updated_at = NOW()
       RETURNING *`, [
            params.workspaceId, params.emailAddress,
            params.imapHost, params.imapPort,
            params.smtpHost, params.smtpPort,
            params.username, params.password,
            params.useSsl,
        ]);
        return result.rows[0];
    }
    // ─── Gmail API Methods ──────────────────────────────────────────
    /**
     * Fetch new emails via Gmail API
     */
    async pollGmail(connection) {
        try {
            const accessToken = await this.getValidAccessToken(connection);
            // Build query — get unread messages since last poll
            let query = 'is:unread in:inbox';
            const afterParam = connection.last_uid ? `&q=${encodeURIComponent(query + ` after:${connection.last_uid}`)}` : `&q=${encodeURIComponent(query)}`;
            const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20${afterParam}`, { headers: { Authorization: `Bearer ${accessToken}` } });
            if (!listRes.ok) {
                console.error(`[EmailChannel] Gmail list failed: ${await listRes.text()}`);
                return;
            }
            const listData = await listRes.json();
            if (!listData.messages?.length)
                return;
            let latestTimestamp = '';
            for (const msg of listData.messages) {
                try {
                    // Get full message
                    const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, { headers: { Authorization: `Bearer ${accessToken}` } });
                    if (!msgRes.ok)
                        continue;
                    const msgData = await msgRes.json();
                    const parsed = this.parseGmailMessage(msgData);
                    if (!parsed)
                        continue;
                    // Skip emails from ourselves
                    if (parsed.from.includes(connection.email_address))
                        continue;
                    // Process the inbound email
                    await this.processInboundEmail(connection, parsed);
                    // Track latest timestamp for pagination
                    const internalDate = msgData.internalDate;
                    if (!latestTimestamp || internalDate > latestTimestamp) {
                        latestTimestamp = internalDate;
                    }
                    // Mark as read in Gmail
                    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
                    });
                }
                catch (e) {
                    console.error(`[EmailChannel] Failed to process email ${msg.id}: ${e.message}`);
                }
            }
            // Update last UID
            if (latestTimestamp) {
                // Store as epoch seconds for "after:" query
                const epochSeconds = Math.floor(parseInt(latestTimestamp) / 1000);
                await pool.query(`UPDATE email_connections SET last_uid = $1, updated_at = NOW() WHERE id = $2`, [epochSeconds.toString(), connection.id]);
            }
        }
        catch (e) {
            console.error(`[EmailChannel] Poll error for ${connection.email_address}: ${e.message}`);
        }
    }
    /**
     * Parse a Gmail API message into our standard format
     */
    parseGmailMessage(gmailMsg) {
        const headers = gmailMsg.payload?.headers || [];
        const getHeader = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
        const from = getHeader('From') || '';
        const to = getHeader('To') || '';
        const subject = getHeader('Subject') || '(no subject)';
        const messageId = getHeader('Message-ID') || getHeader('Message-Id') || '';
        const inReplyTo = getHeader('In-Reply-To') || undefined;
        const references = getHeader('References') || undefined;
        const dateStr = getHeader('Date');
        // Extract text body
        const textBody = this.extractGmailBody(gmailMsg.payload);
        if (!textBody)
            return null;
        // Parse "From: Name <email>" format
        const fromMatch = from.match(/^(.*?)\s*<(.+?)>$/);
        const fromEmail = fromMatch ? fromMatch[2] : from;
        const fromName = fromMatch ? fromMatch[1].trim().replace(/^"|"$/g, '') : undefined;
        return {
            from: fromEmail,
            from_name: fromName,
            to,
            subject,
            text_body: textBody,
            message_id: messageId,
            in_reply_to: inReplyTo,
            references,
            date: dateStr ? new Date(dateStr) : new Date(),
        };
    }
    /**
     * Recursively extract text/plain body from Gmail payload
     */
    extractGmailBody(payload) {
        if (payload.mimeType === 'text/plain' && payload.body?.data) {
            return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
        }
        if (payload.parts) {
            for (const part of payload.parts) {
                const text = this.extractGmailBody(part);
                if (text)
                    return text;
            }
        }
        // Fallback: try text/html and strip tags
        if (payload.mimeType === 'text/html' && payload.body?.data) {
            const html = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
            return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        }
        return '';
    }
    // ─── Inbound Processing ─────────────────────────────────────────
    /**
     * Process an inbound email — find/create conversation, trigger auto-reply
     */
    async processInboundEmail(connection, email) {
        const workspaceId = connection.workspace_id;
        // 1. Find or create contact
        let contactResult = await pool.query(`SELECT id FROM contacts WHERE workspace_id = $1 AND email = $2 LIMIT 1`, [workspaceId, email.from]);
        let contactId;
        if (contactResult.rows.length) {
            contactId = contactResult.rows[0].id;
        }
        else {
            const newContact = await pool.query(`INSERT INTO contacts (workspace_id, email, name, channel, external_id)
         VALUES ($1, $2, $3, 'email', $4) RETURNING id`, [workspaceId, email.from, email.from_name || email.from, email.from]);
            contactId = newContact.rows[0].id;
        }
        // 2. Find existing thread or create new conversation
        let conversationId;
        let isNewThread = false;
        // Check if this is a reply to an existing thread
        if (email.in_reply_to || email.references) {
            const threadResult = await pool.query(`SELECT et.conversation_id FROM email_threads et
         WHERE et.workspace_id = $1 AND (
           et.thread_id = $2 OR et.thread_id = $3
         ) LIMIT 1`, [workspaceId, email.in_reply_to || '', email.message_id]);
            if (threadResult.rows.length) {
                conversationId = threadResult.rows[0].conversation_id;
            }
            else {
                // Also check references header for thread matching
                const refs = (email.references || '').split(/\s+/).filter(Boolean);
                let found = false;
                for (const ref of refs) {
                    const refResult = await pool.query(`SELECT conversation_id FROM email_threads WHERE workspace_id = $1 AND thread_id = $2 LIMIT 1`, [workspaceId, ref]);
                    if (refResult.rows.length) {
                        conversationId = refResult.rows[0].conversation_id;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    isNewThread = true;
                    conversationId = await this.createEmailConversation(workspaceId, contactId, email);
                }
            }
        }
        else {
            isNewThread = true;
            conversationId = await this.createEmailConversation(workspaceId, contactId, email);
        }
        // 3. Save email thread reference
        if (isNewThread || email.message_id) {
            await pool.query(`INSERT INTO email_threads (workspace_id, conversation_id, email_connection_id, thread_id, subject, from_address, to_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`, [workspaceId, conversationId, connection.id, email.message_id, email.subject, email.from, email.to]);
        }
        // 4. Save message
        const msgResult = await pool.query(`INSERT INTO messages (conversation_id, sender_type, sender_id, content, message_type, metadata, contact_id)
       VALUES ($1, 'visitor', $2, $3, 'text', $4, $5) RETURNING id`, [
            conversationId, email.from,
            email.text_body.slice(0, 50000), // Limit body size
            JSON.stringify({
                channel: 'email',
                subject: email.subject,
                message_id: email.message_id,
                in_reply_to: email.in_reply_to,
            }),
            contactId,
        ]);
        // 5. Update conversation
        await pool.query(`UPDATE conversations SET
        last_message_preview = $1, last_message_at = $2, updated_at = NOW(), is_read = false, status = 'open'
       WHERE id = $3`, [email.text_body.slice(0, 200), email.date, conversationId]);
        // 6. Fire integration events (Zapier, Slack, CRM sync) — non-blocking
        integrationEvents.fireEvent('message.received', {
            workspaceId,
            conversation: { id: conversationId, channel: 'email' },
            message: { text: email.text_body.slice(0, 500), sender: email.from_name || email.from, senderType: 'visitor' },
            contact: { email: email.from, name: email.from_name || email.from },
        }).catch((e) => console.error('[EmailChannel] Event fire error:', e.message));
        // 7. Trigger auto-reply
        autoReplyEngine.processInboundMessage({
            workspaceId,
            conversationId: conversationId,
            messageId: msgResult.rows[0].id,
            channel: 'email',
            visitorMessage: email.text_body,
            senderId: email.from,
            accountId: connection.id,
            contactId,
        }).catch((e) => {
            console.error(`[EmailChannel] Auto-reply failed: ${e.message}`);
        });
    }
    /**
     * Create a new email conversation
     */
    async createEmailConversation(workspaceId, contactId, email) {
        const result = await pool.query(`INSERT INTO conversations (workspace_id, channel, status, visitor_id, visitor_name, visitor_email, contact_id, subject)
       VALUES ($1, 'email', 'open', $2, $3, $4, $5, $6) RETURNING id`, [workspaceId, email.from, email.from_name || email.from, email.from, contactId, email.subject]);
        // Fire conversation.created event — non-blocking
        integrationEvents.fireEvent('conversation.created', {
            workspaceId,
            conversation: { id: result.rows[0].id, channel: 'email' },
            contact: { email: email.from, name: email.from_name || email.from },
        }).catch((e) => console.error('[EmailChannel] Event fire error:', e.message));
        return result.rows[0].id;
    }
    // ─── Outbound (Reply) ──────────────────────────────────────────
    /**
     * Send a reply to an email conversation
     */
    async sendReply(conversationId, replyText) {
        // Get the thread info
        const threadResult = await pool.query(`SELECT et.*, ec.* FROM email_threads et
       JOIN email_connections ec ON ec.id = et.email_connection_id
       WHERE et.conversation_id = $1
       ORDER BY et.created_at DESC LIMIT 1`, [conversationId]);
        if (!threadResult.rows.length) {
            console.error(`[EmailChannel] No email thread found for conversation ${conversationId}`);
            return;
        }
        const thread = threadResult.rows[0];
        if (thread.provider === 'gmail') {
            await this.sendGmailReply(thread, replyText);
        }
        else {
            // SMTP sending would go here
            console.warn('[EmailChannel] SMTP sending not yet implemented');
        }
    }
    /**
     * Send a reply via Gmail API
     */
    async sendGmailReply(thread, replyText) {
        // Get fresh access token
        const connection = {
            id: thread.email_connection_id,
            workspace_id: thread.workspace_id,
            email_address: thread.to_address || thread.email_address,
            provider: thread.provider,
            oauth_access_token: thread.oauth_access_token,
            oauth_refresh_token: thread.oauth_refresh_token,
            oauth_token_expires_at: thread.oauth_token_expires_at,
            use_ssl: true,
            is_active: true,
        };
        const accessToken = await this.getValidAccessToken(connection);
        // Build MIME message
        const toAddress = thread.from_address;
        const fromAddress = connection.email_address;
        const subject = thread.subject?.startsWith('Re:') ? thread.subject : `Re: ${thread.subject || ''}`;
        const messageParts = [
            `From: ${fromAddress}`,
            `To: ${toAddress}`,
            `Subject: ${subject}`,
            `In-Reply-To: ${thread.thread_id}`,
            `References: ${thread.thread_id}`,
            `Content-Type: text/plain; charset="UTF-8"`,
            `MIME-Version: 1.0`,
            '',
            replyText,
        ];
        const rawMessage = messageParts.join('\r\n');
        const encodedMessage = Buffer.from(rawMessage).toString('base64url');
        const sendRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                raw: encodedMessage,
                threadId: thread.thread_id,
            }),
        });
        if (!sendRes.ok) {
            const err = await sendRes.text();
            throw new Error(`Gmail send failed: ${err}`);
        }
        console.log(`[EmailChannel] Sent reply to ${toAddress} for conversation ${thread.conversation_id}`);
    }
    // ─── Polling Management ─────────────────────────────────────────
    /**
     * Start polling for all active email connections
     */
    async startPolling() {
        const result = await pool.query(`SELECT * FROM email_connections WHERE is_active = true`);
        for (const conn of result.rows) {
            this.startPollingForConnection(conn);
        }
        console.log(`[EmailChannel] Started polling for ${result.rows.length} email connection(s)`);
    }
    /**
     * Start polling for a specific connection
     */
    startPollingForConnection(connection) {
        if (this.pollingIntervals.has(connection.id))
            return;
        const interval = setInterval(async () => {
            if (connection.provider === 'gmail') {
                await this.pollGmail(connection);
            }
            // IMAP polling would go here for smtp_imap provider
        }, 60_000); // Poll every 60 seconds
        this.pollingIntervals.set(connection.id, interval);
        console.log(`[EmailChannel] Polling started for ${connection.email_address}`);
        // Run first poll immediately
        if (connection.provider === 'gmail') {
            this.pollGmail(connection).catch(e => console.error(`[EmailChannel] Initial poll failed: ${e.message}`));
        }
    }
    /**
     * Stop polling for a specific connection
     */
    stopPolling(connectionId) {
        const interval = this.pollingIntervals.get(connectionId);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(connectionId);
        }
    }
    /**
     * Stop all polling
     */
    stopAllPolling() {
        for (const [id, interval] of this.pollingIntervals) {
            clearInterval(interval);
        }
        this.pollingIntervals.clear();
    }
    // ─── Connection Management ──────────────────────────────────────
    /**
     * Get all email connections for a workspace
     */
    async getConnections(workspaceId) {
        const result = await pool.query(`SELECT id, workspace_id, email_address, provider, use_ssl, is_active, created_at, updated_at
       FROM email_connections WHERE workspace_id = $1 ORDER BY created_at DESC`, [workspaceId]);
        return result.rows;
    }
    /**
     * Disconnect an email connection
     */
    async disconnect(connectionId, workspaceId) {
        this.stopPolling(connectionId);
        await pool.query(`UPDATE email_connections SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND workspace_id = $2`, [connectionId, workspaceId]);
    }
}
export const emailChannelService = new EmailChannelService();
//# sourceMappingURL=EmailChannelService.js.map