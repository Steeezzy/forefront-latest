import twilio from 'twilio';
import { env } from '../config/env.js';

export class TwilioService {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }

  async sendSMS(to: string, message: string): Promise<{ method: string; sid: string }> {
    try {
      if (!env.TWILIO_PHONE_NUMBER) {
        throw new Error('TWILIO_PHONE_NUMBER is not configured');
      }

      const response = await this.client.messages.create({
        body: message,
        from: env.TWILIO_PHONE_NUMBER,
        to
      });
      return { method: 'sms_sent', sid: response.sid };
    } catch (error) {
      console.error('Failed to send SMS via Twilio:', error);
      throw error;
    }
  }

  async makeOutboundCall(toNumber: string, twimlUrl: string): Promise<string> {
    try {
      if (!env.TWILIO_PHONE_NUMBER) {
        throw new Error('TWILIO_PHONE_NUMBER is not configured');
      }

      const BASE_URL = env.BACKEND_URL || 'http://localhost:8000';
      const statusCallback = `${BASE_URL}/api/webhooks/twilio/voice/status`;

      const response = await this.client.calls.create({
        url: twimlUrl,
        to: toNumber,
        from: env.TWILIO_PHONE_NUMBER,
        statusCallback,
        statusCallbackEvent: ['completed', 'failed'],
        statusCallbackMethod: 'POST'
      });
      
      return response.sid;
    } catch (error) {
      console.error('Failed to make outbound call via Twilio:', error);
      throw error;
    }
  }

  buildVoiceResponse(text: string, gatherUrl: string, language: string = 'en-IN'): string {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    
    const gather = twiml.gather({
      input: ['speech'],
      action: gatherUrl,
      language: language as any, // Using proper BCP-47 tag provided by language pack
      speechTimeout: 'auto',
      method: 'POST'
    });
    
    // We assume the text has already been converted to TTS audio if using Sarvam, 
    // but if we are just returning TwiML text we can fallback to AWS/Google TTS via standard Say.
    // Realistically, for fully Sarvam integrated flow, Sarvam TTS would generate an MP3 we <Play>.
    // For standard Twilio usage:
    gather.say({ language: language as any }, text);

    return twiml.toString();
  }

  buildOutboundReminder(message: string, callbackUrl: string): string {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const gather = twiml.gather({
      input: ['dtmf'],
      action: callbackUrl,
      numDigits: 1,
      method: 'POST'
    });

    gather.say(message);

    // Provide options
    gather.say('Press 1 to confirm. Press 2 to reschedule. Press 3 to speak to reception.');

    return twiml.toString();
  }
}

export const twilioService = new TwilioService();
