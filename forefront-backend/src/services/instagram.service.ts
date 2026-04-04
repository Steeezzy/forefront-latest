interface InstagramSendResponse {
  messageId: string;
}

interface InstagramIncomingParsed {
  senderId: string;
  senderUsername: string;
  messageText: string;
  messageId: string;
}

export class InstagramService {
  private async postGraph(pageAccessToken: string, body: Record<string, unknown>): Promise<any> {
    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Instagram Graph API error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async sendDM(
    pageAccessToken: string,
    recipientId: string,
    message: string
  ): Promise<InstagramSendResponse> {
    const data = await this.postGraph(pageAccessToken, {
      recipient: { id: recipientId },
      message: { text: message },
      messaging_type: 'RESPONSE',
    });

    return { messageId: data?.message_id || '' };
  }

  async sendQuickReplies(
    pageAccessToken: string,
    recipientId: string,
    text: string,
    options: string[]
  ): Promise<InstagramSendResponse> {
    const quickReplies = options.slice(0, 11).map((option) => ({
      content_type: 'text',
      title: option.slice(0, 20),
      payload: option,
    }));

    const data = await this.postGraph(pageAccessToken, {
      recipient: { id: recipientId },
      message: {
        text,
        quick_replies: quickReplies,
      },
      messaging_type: 'RESPONSE',
    });

    return { messageId: data?.message_id || '' };
  }

  parseIncomingMessage(body: any): InstagramIncomingParsed {
    const entry = body?.entry?.[0] || {};
    const event = entry?.messaging?.[0] || {};

    return {
      senderId: event?.sender?.id || '',
      senderUsername: event?.sender?.username || event?.sender?.id || 'instagram_user',
      messageText: event?.message?.text || '',
      messageId: event?.message?.mid || '',
    };
  }
}

export const instagramService = new InstagramService();
