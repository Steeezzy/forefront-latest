import twilio from 'twilio';
import { twilioService } from './twilio.service.js';

type IvrDb = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

type IvrOption = {
  digit: string;
  label: string;
  action: 'ai_conversation' | 'transfer' | 'voicemail' | 'hangup';
  target?: string;
  context?: string;
};

export class IVRService {
  async getMenu(db: IvrDb, workspaceId: string) {
    const result = await db.query(
      `SELECT *
       FROM ivr_menus
       WHERE workspace_id = $1
       LIMIT 1`,
      [workspaceId]
    );

    if (!result.rows[0]) {
      return null;
    }

    return this.normalizeMenu(result.rows[0]);
  }

  generateGatherTwiML(ivrMenu: any, introMessage?: string) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    const gather = response.gather({
      numDigits: 1,
      action: this.voiceWebhookUrl('/ivr'),
      method: 'POST',
      timeout: Number(ivrMenu.timeout_seconds || 5),
    });

    if (introMessage) {
      gather.say(introMessage);
    }

    gather.say(ivrMenu.greeting_message);

    for (const option of this.getOptions(ivrMenu)) {
      gather.say(`Press ${option.digit} for ${option.label}.`);
    }

    response.say(this.getTimeoutMessage(ivrMenu));
    response.redirect({ method: 'POST' }, this.voiceWebhookUrl('/ivr'));

    return response.toString();
  }

  async handleDigitPressed(
    db: IvrDb,
    workspaceId: string,
    digit: string | undefined,
    callSid: string,
    retryCount: number = 0
  ) {
    void callSid;

    const ivrMenu = await this.getMenu(db, workspaceId);
    if (!ivrMenu) {
      return this.startAiConversationTwiML('How can I help you today?');
    }

    if (!digit) {
      return this.generateRetryTwiML(retryCount, Number(ivrMenu.max_retries || 3), ivrMenu);
    }

    const option = this.getOptions(ivrMenu).find((entry) => entry.digit === String(digit));
    if (!option) {
      return this.generateRetryTwiML(retryCount, Number(ivrMenu.max_retries || 3), ivrMenu);
    }

    switch (option.action) {
      case 'ai_conversation':
        return this.startAiConversationTwiML(
          option.context
            ? `You selected ${option.label}. Let's continue with ${option.context}. Please tell me how I can help.`
            : `You selected ${option.label}. Please tell me how I can help.`
        );
      case 'transfer':
        return this.generateTransferTwiML(option.target, option.label);
      case 'voicemail':
        return this.generateVoicemailTwiML(option.label);
      case 'hangup':
        return this.generateHangupTwiML();
      default:
        return this.generateRetryTwiML(retryCount, Number(ivrMenu.max_retries || 3), ivrMenu);
    }
  }

  generateRetryTwiML(retryCount: number, maxRetries: number, ivrMenu: any) {
    if (retryCount < maxRetries) {
      return this.generateGatherTwiML(ivrMenu, 'Invalid input. Please try again.');
    }

    return this.executeTimeoutAction(ivrMenu);
  }

  private executeTimeoutAction(ivrMenu: any) {
    switch (ivrMenu.timeout_action) {
      case 'hangup':
        return this.generateHangupTwiML();
      case 'voicemail':
        return this.generateVoicemailTwiML('voicemail');
      case 'transfer': {
        const fallbackOption = this.getOptions(ivrMenu).find((option) => option.action === 'transfer');
        return this.generateTransferTwiML(fallbackOption?.target, fallbackOption?.label || 'support');
      }
      case 'ai_conversation':
      default:
        return this.startAiConversationTwiML('Connecting you to our automated assistant. How can I help you today?');
    }
  }

  private startAiConversationTwiML(prompt: string) {
    const gatherUrl = this.voiceWebhookUrl('/gather');
    return twilioService.buildVoiceResponse(prompt, gatherUrl);
  }

  private generateTransferTwiML(target: string | undefined, label: string) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    if (!target) {
      response.say(`Sorry, ${label} is not available right now.`);
      response.hangup();
      return response.toString();
    }

    response.say(`Connecting you to ${label}.`);
    response.dial(target);
    return response.toString();
  }

  private generateVoicemailTwiML(label: string) {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say(`Please leave a voicemail for ${label} after the tone.`);
    response.record({
      maxLength: 120,
      transcribe: true,
      transcribeCallback: this.voiceWebhookUrl('/voicemail'),
    });
    return response.toString();
  }

  private generateHangupTwiML() {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say('Goodbye.');
    response.hangup();
    return response.toString();
  }

  private getTimeoutMessage(ivrMenu: any) {
    switch (ivrMenu.timeout_action) {
      case 'transfer':
        return 'No input received. Transferring your call.';
      case 'voicemail':
        return 'No input received. Sending you to voicemail.';
      case 'hangup':
        return 'No input received. Goodbye.';
      case 'ai_conversation':
      default:
        return 'No input received. Connecting you to our automated assistant.';
    }
  }

  private getOptions(ivrMenu: any): IvrOption[] {
    const rawOptions = Array.isArray(ivrMenu.options)
      ? ivrMenu.options
      : typeof ivrMenu.options === 'string'
        ? this.safeParseOptions(ivrMenu.options)
        : [];

    return rawOptions.filter((option: any) => option && option.digit && option.label && option.action);
  }

  private safeParseOptions(value: string): IvrOption[] {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  private normalizeMenu(menu: any) {
    return {
      ...menu,
      options: this.getOptions(menu),
    };
  }

  private voiceWebhookUrl(pathname: string) {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return `${baseUrl}/api/webhooks/twilio/voice${pathname}`;
  }
}

export const ivrService = new IVRService();
