import { pool } from '../config/db.js';

export interface CreateAppointmentInput {
  workspace_id: string;
  customer_id?: string | null;
  service?: string;
  service_id?: string | null;
  date: string;
  notes?: string;
  status?: string;
}

const ACTIVE_APPOINTMENT_STATUSES_SQL =
  "COALESCE(a.status, 'scheduled') NOT IN ('cancelled', 'canceled', 'no_show')";

const slotDurationCache = new Map<string, { value: number; expiresAt: number }>();
const slotDurationCacheTtlMs = (() => {
  const parsed = Number(process.env.WORKSPACE_SLOT_CACHE_TTL_MS || 30_000);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 30_000;
})();

const bookingLockRetryAttempts = (() => {
  const parsed = Number(process.env.BOOKING_LOCK_RETRY_ATTEMPTS || 3);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 3;
  }
  return Math.min(8, Math.max(1, Math.trunc(parsed)));
})();

const bookingLockRetryBaseMs = (() => {
  const parsed = Number(process.env.BOOKING_LOCK_RETRY_BASE_MS || 20);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20;
  }
  return Math.min(250, Math.max(5, Math.trunc(parsed)));
})();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertWorkspaceId(workspaceId?: string) {
  if (!workspaceId) {
    throw new Error('workspace_id is required');
  }
}

function normalizeDurationMinutes(value: any, fallback = 30) {
  const duration = Number(value);
  if (!Number.isFinite(duration) || duration <= 0) {
    return fallback;
  }
  return Math.trunc(duration);
}

async function getWorkspaceSlotDuration(workspaceId: string) {
  const cached = slotDurationCache.get(workspaceId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const workspaceResult = await pool.query(
    `SELECT config
     FROM workspaces
     WHERE id = $1
     LIMIT 1`,
    [workspaceId]
  );

  const config = workspaceResult.rows[0]?.config;
  const slotDuration = config?.slot_duration;
  const normalized = normalizeDurationMinutes(slotDuration, 30);

  slotDurationCache.set(workspaceId, {
    value: normalized,
    expiresAt: Date.now() + slotDurationCacheTtlMs,
  });

  return normalized;
}

function normalizeDateToSlotGrid(date: string, slotDurationMinutes: number) {
  const parsed = new Date(String(date));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid appointment date');
  }

  const slotMs = Math.max(1, slotDurationMinutes) * 60 * 1000;
  const rounded = Math.round(parsed.getTime() / slotMs) * slotMs;
  return new Date(rounded).toISOString();
}

async function hasConflictingAppointment(
  workspaceId: string,
  normalizedStartDate: string,
  effectiveDurationMinutes: number,
  workspaceSlotDuration: number
) {
  const existing = await pool.query(
    `SELECT a.id
     FROM appointments a
     WHERE a.workspace_id = $1
       AND ${ACTIVE_APPOINTMENT_STATUSES_SQL}
       AND a.date < ($2::timestamp + make_interval(mins => $3))
       AND (
         a.date + make_interval(
           mins => GREATEST(1, COALESCE(a.duration_minutes, $4))
         )
       ) > $2::timestamp
     LIMIT 1`,
    [workspaceId, normalizedStartDate, effectiveDurationMinutes, workspaceSlotDuration]
  );

  return existing.rows.length > 0;
}

export async function isSlotAvailable(
  workspaceId: string,
  date: string | Date,
  durationMinutes?: number | null
) {
  assertWorkspaceId(workspaceId);

  const slotDuration = await getWorkspaceSlotDuration(workspaceId);
  const rawDate = date instanceof Date ? date.toISOString() : String(date);
  const normalizedStartDate = normalizeDateToSlotGrid(rawDate, slotDuration);

  const effectiveDuration = durationMinutes && durationMinutes > 0
    ? normalizeDurationMinutes(durationMinutes)
    : slotDuration;

  const hasConflict = await hasConflictingAppointment(
    workspaceId,
    normalizedStartDate,
    effectiveDuration,
    slotDuration
  );

  return !hasConflict;
}

type ResolvedServiceDetails = {
  id: string | null;
  name: string;
  durationMinutes: number | null;
};

async function resolveServiceDetails(
  workspaceId: string,
  serviceId?: string | null,
  fallbackService?: string
): Promise<ResolvedServiceDetails | null> {
  if (serviceId) {
    const result = await pool.query(
      `SELECT id, name, duration
       FROM services
       WHERE id = $1
         AND workspace_id = $2
         AND COALESCE(is_active, true) = true
       LIMIT 1`,
      [serviceId, workspaceId]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      durationMinutes: row.duration === null || row.duration === undefined
        ? null
        : normalizeDurationMinutes(row.duration),
    };
  }

  const normalizedService = String(fallbackService || '').trim();
  if (!normalizedService) {
    return null;
  }

  const resolvedByName = await pool.query(
    `SELECT id, name, duration
     FROM services
     WHERE workspace_id = $1
       AND COALESCE(is_active, true) = true
       AND (
         lower(name) = lower($2)
         OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(COALESCE(metadata->'aliases', '[]'::jsonb)) AS alias(value)
           WHERE lower(alias.value) = lower($2)
         )
       )
     ORDER BY
       CASE WHEN lower(name) = lower($2) THEN 0 ELSE 1 END,
       created_at ASC
     LIMIT 1`,
    [workspaceId, normalizedService]
  );

  const matched = resolvedByName.rows[0];
  if (matched) {
    return {
      id: matched.id,
      name: matched.name,
      durationMinutes: matched.duration === null || matched.duration === undefined
        ? null
        : normalizeDurationMinutes(matched.duration),
    };
  }

  const inactiveMatch = await pool.query(
    `SELECT id
     FROM services
     WHERE workspace_id = $1
       AND COALESCE(is_active, true) = false
       AND (
         lower(name) = lower($2)
         OR EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(COALESCE(metadata->'aliases', '[]'::jsonb)) AS alias(value)
           WHERE lower(alias.value) = lower($2)
         )
       )
     LIMIT 1`,
    [workspaceId, normalizedService]
  );

  if (inactiveMatch.rows.length > 0) {
    throw new Error('Selected service is currently inactive');
  }

  return {
    id: null,
    name: normalizedService,
    durationMinutes: null,
  };
}

export async function createAppointment(data: CreateAppointmentInput) {
  assertWorkspaceId(data.workspace_id);

  if (!data.service && !data.service_id) {
    throw new Error('service or service_id is required');
  }

  const resolvedService = await resolveServiceDetails(
    data.workspace_id,
    data.service_id,
    data.service
  );

  if (data.service_id && !resolvedService?.id) {
    throw new Error('service_id does not belong to workspace');
  }

  if (!resolvedService) {
    throw new Error('Unable to resolve service name');
  }

  const slotDuration = await getWorkspaceSlotDuration(data.workspace_id);
  const normalizedDate = normalizeDateToSlotGrid(data.date, slotDuration);
  const requestedDuration = resolvedService.durationMinutes ?? slotDuration;
  const advisoryLockKey = `${data.workspace_id}:${normalizedDate}`;

  for (let attempt = 0; attempt < bookingLockRetryAttempts; attempt += 1) {
    const result = await pool.query(
      `WITH gate AS (
         SELECT pg_try_advisory_xact_lock(hashtext($10)) AS acquired
       ),
       inserted AS (
         INSERT INTO appointments (
           workspace_id,
           customer_id,
           service_id,
           service,
           date,
           status,
           notes,
           duration_minutes
         )
         SELECT
           $1,
           $2,
           $3,
           $4,
           $5::timestamp,
           $6,
           $7,
           $8
         FROM gate
         WHERE gate.acquired
           AND NOT EXISTS (
             SELECT 1
             FROM appointments a
             WHERE a.workspace_id = $1
               AND ${ACTIVE_APPOINTMENT_STATUSES_SQL}
               AND a.date < ($5::timestamp + make_interval(mins => $8))
               AND (
                 a.date + make_interval(
                   mins => GREATEST(1, COALESCE(a.duration_minutes, $9))
                 )
               ) > $5::timestamp
           )
         RETURNING *
       )
       SELECT * FROM inserted`,
      [
        data.workspace_id,
        data.customer_id || null,
        resolvedService.id,
        resolvedService.name,
        normalizedDate,
        data.status || 'scheduled',
        data.notes || null,
        requestedDuration,
        slotDuration,
        advisoryLockKey,
      ]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    const hasConflict = await hasConflictingAppointment(
      data.workspace_id,
      normalizedDate,
      requestedDuration,
      slotDuration
    );

    if (hasConflict) {
      throw new Error('Slot not available');
    }

    if (attempt < bookingLockRetryAttempts - 1) {
      const backoffMs = bookingLockRetryBaseMs + Math.floor(Math.random() * bookingLockRetryBaseMs);
      await sleep(backoffMs);
    }
  }

  throw new Error('Slot not available');
}
