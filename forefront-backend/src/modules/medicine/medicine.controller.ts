import { FastifyRequest, FastifyReply } from 'fastify';
import { medicineService } from '../../services/medicine.service.js';
import { pool } from '../../config/db.js';

export class MedicineController {
  async createReminder(request: FastifyRequest, reply: FastifyReply) {
    const client = await pool.connect();
    try {
      const data: any = request.body;
      const result = await medicineService.createReminder(client, data.workspaceId, data);
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    } finally {
      client.release();
    }
  }

  async getReminders(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { status } = request.query as { status?: string };
      
      let query = `SELECT * FROM medicine_reminders WHERE workspace_id = $1`;
      const values: any[] = [workspaceId];
      
      if (status) {
        query += ` AND status = $2`;
        values.push(status);
      }
      
      const res = await pool.query(query, values);
      return reply.send({ reminders: res.rows });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async getFollowups(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const res = await pool.query(
        `SELECT * FROM followup_reminders WHERE workspace_id = $1`,
        [workspaceId]
      );
      return reply.send({ followups: res.rows });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async getCompliance(request: FastifyRequest, reply: FastifyReply) {
    const client = await pool.connect();
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const medicines = await medicineService.getComplianceReport(client, workspaceId);
      
      // Compute aggregates
      const total_patients = new Set(medicines.map(m => m.patient)).size;
      const total_medicines = medicines.length;

      return reply.send({
        total_patients,
        total_medicines,
        medicines
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    } finally {
      client.release();
    }
  }

  async markTaken(request: FastifyRequest, reply: FastifyReply) {
    const client = await pool.connect();
    try {
      const { reminderId } = request.params as { reminderId: string };
      await medicineService.markDoseTaken(client, reminderId);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    } finally {
      client.release();
    }
  }

  async markMissed(request: FastifyRequest, reply: FastifyReply) {
    const client = await pool.connect();
    try {
      const { reminderId } = request.params as { reminderId: string };
      await medicineService.markDoseMissed(client, reminderId);
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    } finally {
      client.release();
    }
  }

  async confirmFollowup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { followupId } = request.params as { followupId: string };
      await pool.query(
        `UPDATE followup_reminders SET confirmed = true, status = 'confirmed' WHERE id = $1`,
        [followupId]
      );
      return reply.send({ success: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }
}

export const medicineController = new MedicineController();
