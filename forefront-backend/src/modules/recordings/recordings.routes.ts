import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { pool } from '../../config/db.js';
import { sarvamClient } from '../../services/SarvamClient.js';

function buildTwilioAuthHeader() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';

  if (!accountSid || !authToken) {
    return undefined;
  }

  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
}

async function downloadRecording(recordingUrl: string) {
  const authHeader = buildTwilioAuthHeader();
  const candidates = recordingUrl.endsWith('.mp3')
    ? [recordingUrl]
    : [`${recordingUrl}.mp3`, recordingUrl];

  for (const url of candidates) {
    const response = await fetch(url, {
      headers: authHeader ? { Authorization: authHeader } : undefined,
    });

    if (!response.ok) {
      continue;
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: response.headers.get('content-type') || 'audio/mpeg',
      fileSize: Number(response.headers.get('content-length') || arrayBuffer.byteLength || 0),
      resolvedUrl: url,
    };
  }

  throw new Error('Unable to download recording audio from Twilio');
}

export async function recordingsRoutes(app: FastifyInstance) {
  app.get('/:workspaceId', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const { from, to, page = '1', limit = '20' } = request.query as {
        from?: string;
        to?: string;
        page?: string;
        limit?: string;
      };

      const safePage = Math.max(Number(page) || 1, 1);
      const safeLimit = Math.max(Number(limit) || 20, 1);
      const offset = (safePage - 1) * safeLimit;

      const params: any[] = [workspaceId];
      let query = `
        SELECT
          id,
          call_id,
          recording_url,
          recording_sid,
          duration,
          file_size,
          created_at,
          transcription
        FROM call_recordings
        WHERE workspace_id = $1
      `;

      if (from) {
        params.push(from);
        query += ` AND created_at >= $${params.length}`;
      }

      if (to) {
        params.push(to);
        query += ` AND created_at <= $${params.length}`;
      }

      params.push(safeLimit, offset);
      query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await pool.query(query, params);
      return reply.send({
        recordings: result.rows.map((row) => ({
          ...row,
          has_transcription: Boolean(row.transcription),
        })),
        page: safePage,
        limit: safeLimit,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:recordingId/play', async (request, reply) => {
    try {
      const { recordingId } = request.params as { recordingId: string };
      const result = await pool.query(
        `SELECT recording_url
         FROM call_recordings
         WHERE id = $1
         LIMIT 1`,
        [recordingId]
      );

      if (!result.rows[0]?.recording_url) {
        return reply.status(404).send({ error: 'Recording not found' });
      }

      return reply.redirect(result.rows[0].recording_url);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:recordingId/transcript', async (request, reply) => {
    try {
      const { recordingId } = request.params as { recordingId: string };
      const result = await pool.query(
        `SELECT transcription
         FROM call_recordings
         WHERE id = $1
         LIMIT 1`,
        [recordingId]
      );

      if (!result.rows[0]) {
        return reply.status(404).send({ error: 'Recording not found' });
      }

      if (!result.rows[0].transcription) {
        return reply.send({ status: 'pending' });
      }

      return reply.send({ status: 'completed', transcription: result.rows[0].transcription });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.post('/:recordingId/transcribe', async (request, reply) => {
    try {
      const { recordingId } = request.params as { recordingId: string };
      const result = await pool.query(
        `SELECT id, recording_url
         FROM call_recordings
         WHERE id = $1
         LIMIT 1`,
        [recordingId]
      );

      if (!result.rows[0]?.recording_url) {
        return reply.status(404).send({ error: 'Recording not found' });
      }

      const audio = await downloadRecording(result.rows[0].recording_url);
      const transcriptionResult: any = await sarvamClient.speechToText(
        audio.buffer,
        'en-IN',
        audio.mimeType
      );

      const transcription =
        transcriptionResult?.transcript ||
        transcriptionResult?.text ||
        transcriptionResult?.transcription ||
        '';

      await pool.query(
        `UPDATE call_recordings
         SET transcription = $1,
             file_size = COALESCE(file_size, $2)
         WHERE id = $3`,
        [transcription, audio.fileSize, recordingId]
      );

      return reply.send({
        transcribed: true,
        transcription,
        fileSize: audio.fileSize,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.delete('/:recordingId', async (request, reply) => {
    try {
      const { recordingId } = request.params as { recordingId: string };
      await pool.query(
        `DELETE FROM call_recordings
         WHERE id = $1`,
        [recordingId]
      );
      return reply.send({ deleted: true });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });

  app.get('/:workspaceId/stats', async (request, reply) => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const result = await pool.query(
        `SELECT
           COUNT(*)::int AS total_recordings,
           COALESCE(SUM(duration), 0)::int AS total_duration,
           COALESCE(AVG(duration), 0)::float AS average_duration,
           COUNT(*) FILTER (
             WHERE created_at >= NOW() - INTERVAL '7 days'
           )::int AS recordings_this_week
         FROM call_recordings
         WHERE workspace_id = $1`,
        [workspaceId]
      );

      const stats = result.rows[0] || {};
      return reply.send({
        totalRecordings: Number(stats.total_recordings || 0),
        totalDuration: Number(stats.total_duration || 0),
        averageDuration: Number(stats.average_duration || 0),
        recordingsThisWeek: Number(stats.recordings_this_week || 0),
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  });
}
