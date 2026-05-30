import { twilioService } from '../../services/twilio.service.js';
import { pool } from '../../config/db.js';

export class OutboundService {
  async makeCall(data: any) {
    const { workspaceId, phone, purpose, context } = data;
    
    // Construct TwiML URL. Ideally, this points to our webhooks which generate dynamic TwiML
    // For now, assume we generate the initial TwiML statically or have an endpoint that generates it
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const twimlUrl = `${baseUrl}/api/webhooks/twilio/voice/outbound-gather?purpose=${encodeURIComponent(purpose)}&workspaceId=${workspaceId}`;

    const sid = await twilioService.makeOutboundCall(phone, twimlUrl);

    // Optionally log this outbound attempt
    await pool.query(
      `INSERT INTO calls (workspace_id, direction, caller_phone, outcome) VALUES ($1, 'outbound', $2, 'initiated')`,
      [workspaceId, phone]
    );

    return { method: 'call_initiated', sid, purpose };
  }

  async sendSMS(data: any) {
    const { workspaceId, phone, message, purpose } = data;
    const result = await twilioService.sendSMS(phone, message);
    return { method: 'sms_sent', sid: result.sid, purpose };
  }
}

export const outboundService = new OutboundService();
