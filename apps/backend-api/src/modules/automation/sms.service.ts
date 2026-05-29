import { pool } from '../../config/db.js';

interface SendWorkspaceSmsInput {
    workspaceId: string;
    to?: string | null;
    body: string;
}

interface SmsResult {
    status: 'sent' | 'needs_setup' | 'failed';
    provider?: string;
    from?: string;
    sid?: string;
    error?: string;
}

export async function sendWorkspaceSms(input: SendWorkspaceSmsInput): Promise<SmsResult> {
    if (!input.to) {
        return {
            status: 'failed',
            error: 'Customer phone number is unavailable for SMS delivery.',
        };
    }

    let accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    let authToken = process.env.TWILIO_AUTH_TOKEN || '';
    let fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    try {
        const configResult = await pool.query(
            'SELECT account_sid, auth_token_encrypted FROM twilio_config WHERE workspace_id = $1 AND is_active = true LIMIT 1',
            [input.workspaceId]
        );

        if (configResult.rows.length > 0) {
            accountSid = configResult.rows[0].account_sid;
            authToken = configResult.rows[0].auth_token_encrypted;
        }
    } catch (error) {
        // fall back to env vars
    }

    if (!fromNumber) {
        try {
            const numberResult = await pool.query(
                `SELECT number
                 FROM phone_numbers
                 WHERE workspace_id = $1 AND provider = 'twilio' AND status = 'active'
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [input.workspaceId]
            );

            fromNumber = numberResult.rows[0]?.number || '';
        } catch (error) {
            // keep empty and let needs_setup handle it
        }
    }

    if (!accountSid || !authToken || !fromNumber) {
        return {
            status: 'needs_setup',
            provider: 'twilio',
            error: 'Twilio credentials or an active SMS-capable Twilio number are not configured for this workspace.',
        };
    }

    try {
        const twilio = (await import('twilio')).default;
        const client = twilio(accountSid, authToken);
        const message = await client.messages.create({
            to: input.to,
            from: fromNumber,
            body: input.body,
        });

        return {
            status: 'sent',
            provider: 'twilio',
            from: fromNumber,
            sid: message.sid,
        };
    } catch (error: any) {
        return {
            status: 'failed',
            provider: 'twilio',
            from: fromNumber,
            error: error.message || 'SMS send failed',
        };
    }
}
