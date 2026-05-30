import { randomUUID } from 'node:crypto';

interface EmailConfigLike {
  provider?: string;
  inbox_email?: string;
  display_name?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
}

interface EmailSendResponse {
  messageId: string;
  status: string;
}

interface EmailIncomingParsed {
  fromEmail: string;
  fromName: string;
  toEmail: string;
  subject: string;
  messageText: string;
  htmlBody?: string;
  messageId: string;
  threadId?: string;
}

function parseAddress(raw: string): { email: string; name: string } {
  const value = String(raw || '').trim();
  const match = value.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].replace(/^"|"$/g, '').trim() || match[2].trim(),
      email: match[2].trim().toLowerCase(),
    };
  }

  return {
    name: value,
    email: value.toLowerCase(),
  };
}

export class EmailService {
  async sendMessage(
    config: EmailConfigLike,
    toEmail: string,
    subject: string,
    message: string
  ): Promise<EmailSendResponse> {
    const messageId = `<${randomUUID()}@forefront.local>`;

    // Placeholder: this keeps API behavior stable without blocking on provider setup.
    // Wiring to SMTP/Gmail provider can be added without changing module contracts.
    const hasSmtpConfig = Boolean(config?.smtp_host && config?.smtp_username);
    const status = hasSmtpConfig ? 'queued' : 'simulated';

    return {
      messageId,
      status,
    };
  }

  verifyWebhook(
    mode: string,
    token: string,
    verifyToken: string,
    challenge: string
  ): string | null {
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  parseIncomingMessage(body: any): EmailIncomingParsed {
    const fromRaw =
      body?.from ||
      body?.sender ||
      body?.from_email ||
      body?.email ||
      '';

    const toRaw =
      body?.to ||
      body?.recipient ||
      body?.to_email ||
      '';

    const subject = String(
      body?.subject ||
      body?.headers?.subject ||
      '(no subject)'
    );

    const textBody = String(
      body?.text ||
      body?.body ||
      body?.plain ||
      body?.message ||
      ''
    );

    const htmlBody =
      typeof body?.html === 'string'
        ? body.html
        : typeof body?.htmlBody === 'string'
          ? body.htmlBody
          : undefined;

    const messageId = String(
      body?.messageId ||
      body?.message_id ||
      body?.headers?.['message-id'] ||
      body?.headers?.['Message-ID'] ||
      `<${randomUUID()}@incoming.local>`
    );

    const threadId =
      body?.threadId ||
      body?.thread_id ||
      body?.in_reply_to ||
      body?.headers?.['in-reply-to'] ||
      body?.headers?.['In-Reply-To'] ||
      undefined;

    const from = parseAddress(String(fromRaw));
    const to = parseAddress(String(toRaw));

    return {
      fromEmail: from.email,
      fromName: from.name || from.email,
      toEmail: to.email,
      subject,
      messageText: textBody,
      htmlBody,
      messageId,
      threadId: threadId ? String(threadId) : undefined,
    };
  }
}

export const emailService = new EmailService();