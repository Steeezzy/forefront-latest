interface WhatsAppSendResponse {
  messageId: string;
  status: string;
}

interface IncomingMessageParsed {
  senderPhone: string;
  senderName: string;
  messageType: string;
  messageText: string;
  messageId: string;
  mediaUrl?: string;
}

export class WhatsAppService {
  private async postGraph(
    phoneNumberId: string,
    accessToken: string,
    body: Record<string, unknown>
  ): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp Graph API error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async sendMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    message: string
  ): Promise<WhatsAppSendResponse> {
    const data = await this.postGraph(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    });

    return {
      messageId: data?.messages?.[0]?.id || '',
      status: data?.messages?.[0]?.message_status || 'sent',
    };
  }

  async sendTemplateMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    templateName: string,
    languageCode: string,
    components: any[]
  ): Promise<WhatsAppSendResponse> {
    const data = await this.postGraph(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });

    return {
      messageId: data?.messages?.[0]?.id || '',
      status: data?.messages?.[0]?.message_status || 'sent',
    };
  }

  async sendMediaMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    mediaType: 'image' | 'document' | 'audio',
    mediaUrl: string,
    caption?: string
  ): Promise<WhatsAppSendResponse> {
    const mediaPayload: Record<string, unknown> = { link: mediaUrl };
    if (caption && mediaType !== 'audio') {
      mediaPayload.caption = caption;
    }

    const data = await this.postGraph(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      to,
      type: mediaType,
      [mediaType]: mediaPayload,
    });

    return {
      messageId: data?.messages?.[0]?.id || '',
      status: data?.messages?.[0]?.message_status || 'sent',
    };
  }

  async markAsRead(
    phoneNumberId: string,
    accessToken: string,
    messageId: string
  ): Promise<boolean> {
    try {
      await this.postGraph(phoneNumberId, accessToken, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });
      return true;
    } catch {
      return false;
    }
  }

  async verifyWebhook(
    mode: string,
    token: string,
    verifyToken: string,
    challenge: string
  ): Promise<string | null> {
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  parseIncomingMessage(body: any): IncomingMessageParsed {
    const value = body?.entry?.[0]?.changes?.[0]?.value || {};
    const message = value?.messages?.[0] || {};
    const contact = value?.contacts?.[0] || {};

    const messageType = message?.type || 'text';
    const messageText = message?.text?.body || '';
    const mediaUrl =
      message?.[messageType]?.link ||
      message?.[messageType]?.url ||
      message?.[messageType]?.id ||
      undefined;

    return {
      senderPhone: message?.from || '',
      senderName: contact?.profile?.name || 'WhatsApp User',
      messageType,
      messageText,
      messageId: message?.id || '',
      mediaUrl,
    };
  }
}

export const whatsappService = new WhatsAppService();
