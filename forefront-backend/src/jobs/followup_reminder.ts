import cron from 'node-cron';
import { pool } from '../config/db.js';
import { twilioService } from '../services/twilio.service.js';

export function startFollowupJobs() {
    // Every day at 9 AM: Check for upcoming appointments/follow-ups
    cron.schedule('0 9 * * *', async () => {
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT * FROM followup_reminders 
                WHERE status = 'pending' AND scheduled_date > NOW()
            `);

            for (const followup of res.rows) {
                const diffTime = Math.abs(new Date(followup.scheduled_date).getTime() - new Date().getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // 24 Hour check (1 Day Before)
                if (diffDays <= 1 && !followup.reminder_sent_24h) {
                    const message = `Hi ${followup.patient_name}, reminder for your appointment with ${followup.doctor_name} tomorrow at ${followup.scheduled_date}. Reply YES to confirm, or call us.`;
                    await twilioService.sendSMS(followup.patient_phone, message);
                    await client.query(`UPDATE followup_reminders SET reminder_sent_24h = true WHERE id = $1`, [followup.id]);
                }
            }
        } catch (error) {
            console.error('Followup daily cron job error:', error);
        } finally {
            client.release();
        }
    });
}
