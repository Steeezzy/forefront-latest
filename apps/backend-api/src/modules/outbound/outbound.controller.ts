import { FastifyRequest, FastifyReply } from 'fastify';
import { outboundService } from './outbound.service.js';

export class OutboundController {
  async initiateCall(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await outboundService.makeCall(request.body);
      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async sendSms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await outboundService.sendSMS(request.body);
      return reply.status(200).send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }
}

export const outboundController = new OutboundController();
