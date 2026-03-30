import cron from 'node-cron';
import { pool } from '../config/db.js';
import { medicineService } from '../services/medicine.service.js';

export function startMedicineJobs() {
    // Every 1 minute: Check for medicine reminders
    cron.schedule('*/1 * * * *', async () => {
        const client = await pool.connect();
        try {
            // Find active reminders currently between start_date and end_date
            const res = await client.query(`
                SELECT * FROM medicine_reminders 
                WHERE status = 'active'
                  AND start_date <= NOW() 
                  AND end_date >= NOW()
            `);

            const now = new Date();
            const currentHour = String(now.getHours()).padStart(2, '0');
            const currentMin = String(now.getMinutes()).padStart(2, '0');
            const currentTimeStr = `${currentHour}:${currentMin}`;

            for (const reminder of res.rows) {
                // Check schedule limits within 2-min window (simplified text matching for MVP)
                const times: string[] = typeof reminder.schedule_times === 'string' ? JSON.parse(reminder.schedule_times) : reminder.schedule_times;
                
                if (Array.isArray(times) && times.includes(currentTimeStr)) {
                    // Make sure we didn't already send one for this exact schedule_time today
                    const logRes = await client.query(`
                        SELECT id FROM dose_logs 
                        WHERE reminder_id = $1 
                          AND (method = 'sms_sent' OR method = 'call_made')
                          AND DATE(scheduled_time) = CURRENT_DATE
                    `, [reminder.id]);

                    if (logRes.rows.length === 0) {
                        // Send SMS
                        await medicineService.sendDoseReminder(reminder, 'en-IN');
                        
                        // Insert un-acknowledged log
                        await client.query(`
                            INSERT INTO dose_logs (reminder_id, scheduled_time, status, method)
                            VALUES ($1, NOW(), 'pending', 'sms_sent')
                        `, [reminder.id]);
                        
                        // Optionally update total_doses target increment if it's dynamic
                    }
                }
            }
        } catch (error) {
            console.error('Medicine cron job error:', error);
        } finally {
            client.release();
        }
    });

    // Every hour: Check for follow-up reminders
    cron.schedule('0 * * * *', async () => {
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT * FROM followup_reminders 
                WHERE status = 'pending' AND scheduled_date > NOW()
            `);

            for (const followup of res.rows) {
                const diffTime = Math.abs(new Date(followup.scheduled_date).getTime() - new Date().getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

                if (diffDays <= 7 && diffDays > 1 && !followup.reminder_sent_24h) {
                    await medicineService.sendFollowupReminder(followup, diffDays);
                } else if (diffDays <= 1 && !followup.reminder_sent_24h) {
                    await medicineService.sendFollowupReminder(followup, diffDays);
                    await client.query(`UPDATE followup_reminders SET reminder_sent_24h = true WHERE id = $1`, [followup.id]);
                } else if (diffHours <= 2 && !followup.reminder_sent_2h) {
                    await medicineService.sendFollowupReminder(followup, 0); // 0 indicates urgent call
                    await client.query(`UPDATE followup_reminders SET reminder_sent_2h = true WHERE id = $1`, [followup.id]);
                }
            }
        } catch (error) {
            console.error('Followup cron job error:', error);
        } finally {
            client.release();
        }
    });
}
