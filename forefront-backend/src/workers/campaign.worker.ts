import { pool } from '../config/db.js';
import { twilioService } from '../services/twilio.service.js';
import { startCampaignWorker } from '../jobs/campaign_worker.js';

export function startCampaignWorkerProcess() {
  startCampaignWorker(() => pool, twilioService);
}
