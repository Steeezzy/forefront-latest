import { PoolClient } from 'pg';
import { twilioService } from './twilio.service.js';

export class MedicineService {
  /**
   * Creates MedicineReminder records for each medicine in the array,
   * creates optional FollowUpReminder if followup_date provided.
   * Returns { status, reminders_created, followup_created }
   */
  async createReminder(db: PoolClient, workspaceId: string, patientData: any) {
    let reminders_created = 0;
    let followup_created = false;

    // Create a reminder for each medicine
    for (const med of patientData.medicines) {
      await db.query(
        `INSERT INTO medicine_reminders 
         (workspace_id, patient_name, patient_phone, medicine_name, dosage, frequency, schedule_times, duration_days, instructions, start_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          workspaceId,
          patientData.patientName,
          patientData.patientPhone,
          med.name,
          med.dosage,
          med.frequency,
          JSON.stringify(med.scheduleTimes),
          med.durationDays,
          med.instructions,
        ]
      );
      reminders_created++;
    }

    // Optional Follow-up
    if (patientData.followupDate) {
      await db.query(
        `INSERT INTO followup_reminders 
         (workspace_id, patient_name, patient_phone, doctor_name, reason, scheduled_date) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          workspaceId,
          patientData.patientName,
          patientData.patientPhone,
          patientData.followupDoctor,
          patientData.followupReason,
          patientData.followupDate,
        ]
      );
      followup_created = true;
    }

    return { status: 'success', reminders_created, followup_created };
  }

  /**
   * Builds SMS message in patient's language and sends via twilio.service.
   * Returns { method, sid }
   */
  async sendDoseReminder(reminder: any, language: string = 'en-IN') {
    // Ideally use Sarvam Translate API here based on `language` if non-English
    // For now, construct the message standard:
    let message = `Hello ${reminder.patient_name}, it is time for your medication: ${reminder.medicine_name} (${reminder.dosage}). `;
    
    if (reminder.instructions) {
      message += `Instructions: ${reminder.instructions}. `;
    }
    
    message += `Please reply 'taken' when you have completed your dose.`;

    const result = await twilioService.sendSMS(reminder.patient_phone, message);
    return { method: 'sms_sent', sid: result.sid };
  }

  /**
   * If <= 2 days before, makes a call via Twilio. If > 2 days, sends SMS.
   * Returns { method, sid }
   */
  async sendFollowupReminder(followup: any, daysBefore: number, language: string = 'en-IN') {
    if (daysBefore <= 2) {
      // Urgent Call Notification
      const twimlUrl = `http://localhost:8000/api/webhooks/twilio/followup-gather?id=${followup.id}`; 
      // Replace localhost dynamically
      const sid = await twilioService.makeOutboundCall(followup.patient_phone, twimlUrl);
      return { method: 'call_made', sid };
    } else {
      // Gentle SMS
      let message = `Hi ${followup.patient_name}, reminder for your appointment with ${followup.doctor_name} on ${followup.scheduled_date}.`;
      const result = await twilioService.sendSMS(followup.patient_phone, message);
      return { method: 'sms_sent', sid: result.sid };
    }
  }

  /**
   * Increments doses_taken, recalculates compliance_rate
   */
  async markDoseTaken(db: PoolClient, reminderId: string) {
    await db.query(`
      UPDATE medicine_reminders 
      SET doses_taken = doses_taken + 1,
          compliance_rate = CASE 
            WHEN total_doses > 0 THEN ((doses_taken + 1)::float / total_doses) * 100 
            ELSE 100 
          END
      WHERE id = $1
    `, [reminderId]);

    // Insert log
    await db.query(`
      INSERT INTO dose_logs (reminder_id, actual_time, status, method)
      VALUES ($1, NOW(), 'taken', 'manual')
    `, [reminderId]);
  }

  /**
   * Increments doses_missed. If doses_missed >= 2, trigger staff alert
   */
  async markDoseMissed(db: PoolClient, reminderId: string) {
    const res = await db.query(`
      UPDATE medicine_reminders 
      SET doses_missed = doses_missed + 1,
          compliance_rate = CASE 
            WHEN total_doses > 0 THEN (doses_taken::float / total_doses) * 100 
            ELSE 0 
          END
      WHERE id = $1
      RETURNING doses_missed, workspace_id
    `, [reminderId]);

    if (res.rows.length > 0) {
      // Wait: Insert log
      await db.query(`
        INSERT INTO dose_logs (reminder_id, scheduled_time, status, method)
        VALUES ($1, NOW(), 'missed', 'auto')
      `, [reminderId]);

      if (res.rows[0].doses_missed >= 2) {
         // Log or send staff alert event
         console.warn(`[Staff Alert] Patient missed 2+ consecutive doses for reminder ${reminderId} in workspace ${res.rows[0].workspace_id}`);
      }
    }
  }

  /**
   * Returns per-patient, per-medicine data
   */
  async getComplianceReport(db: PoolClient, workspaceId: string) {
    const res = await db.query(`
      SELECT patient_name as patient, medicine_name as medicine, dosage as dosage, 
             doses_taken as taken, doses_missed as missed, total_doses as total, 
             compliance_rate, status, end_date
      FROM medicine_reminders
      WHERE workspace_id = $1
    `, [workspaceId]);
    return res.rows;
  }
}

export const medicineService = new MedicineService();
