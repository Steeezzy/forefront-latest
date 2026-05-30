interface FacebookSendResponse {
  messageId: string;
}

interface FacebookIncomingParsed {
  senderId: string;
  senderName: string;
  messageText: string;
  messageId: string;
}

interface FacebookButton {
  type: 'web_url' | 'postback';
  title: string;
  url?: string;
  payload?: string;
}

export class FacebookService {
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
      throw new Error(`Facebook Graph API error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async sendMessage(
    pageAccessToken: string,
    recipientId: string,
    message: string
  ): Promise<FacebookSendResponse> {
    const data = await this.postGraph(pageAccessToken, {
      recipient: { id: recipientId },
      message: { text: message },
      messaging_type: 'RESPONSE',
    });

    return { messageId: data?.message_id || '' };
  }

  async sendQuickReply(
    pageAccessToken: string,
    recipientId: string,
    text: string,
    options: string[]
  ): Promise<FacebookSendResponse> {
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

  async sendButtonTemplate(
    pageAccessToken: string,
    recipientId: string,
    text: string,
    buttons: FacebookButton[]
  ): Promise<FacebookSendResponse> {
    const data = await this.postGraph(pageAccessToken, {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text,
            buttons,
          },
        },
      },
      messaging_type: 'RESPONSE',
    });

    return { messageId: data?.message_id || '' };
  }

  parseIncomingMessage(body: any): FacebookIncomingParsed {
    const entry = body?.entry?.[0] || {};
    const event = entry?.messaging?.[0] || {};

    return {
      senderId: event?.sender?.id || '',
      senderName: event?.sender?.name || event?.sender?.id || 'facebook_user',
      messageText: event?.message?.text || '',
      messageId: event?.message?.mid || '',
    };
  }
}

export const facebookService = new FacebookService();
