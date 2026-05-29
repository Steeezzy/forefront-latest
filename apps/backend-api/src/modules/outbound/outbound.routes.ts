import { FastifyInstance } from 'fastify';
import { outboundController } from './outbound.controller.js';

export default async function outboundRoutes(app: FastifyInstance) {
    app.post('/call', outboundController.initiateCall.bind(outboundController));
    app.post('/sms', outboundController.sendSms.bind(outboundController));
}
