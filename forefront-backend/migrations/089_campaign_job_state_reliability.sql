-- Migration 089: campaign_jobs state and reliability standardization

ALTER TABLE campaign_jobs
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS queue_job_id TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'campaign_jobs'
      AND column_name = 'attempt_count'
  ) THEN
    UPDATE campaign_jobs
    SET attempts = COALESCE(attempt_count, 0)
    WHERE attempts IS NULL OR attempts = 0;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'campaign_jobs'
      AND column_name = 'last_error'
  ) THEN
    UPDATE campaign_jobs
    SET error_message = COALESCE(error_message, last_error)
    WHERE error_message IS NULL OR error_message = '';
  END IF;
END $$;

UPDATE campaign_jobs
SET status = CASE
  WHEN status IN ('queued') THEN 'queued'
  WHEN status IN ('processing', 'in_progress', 'running') THEN 'processing'
  WHEN status IN ('completed', 'done', 'success') THEN 'completed'
  WHEN status IN ('failed', 'error') THEN 'failed'
  WHEN status IN ('retry_scheduled', 'scheduled', 'retrying') THEN 'retry_scheduled'
  WHEN status IS NULL OR status = '' THEN 'queued'
  ELSE 'failed'
END;

UPDATE campaign_jobs
SET attempts = COALESCE(attempts, 0)
WHERE attempts IS NULL;

ALTER TABLE campaign_jobs
  ALTER COLUMN status SET DEFAULT 'queued';

ALTER TABLE campaign_jobs
  ALTER COLUMN attempts SET DEFAULT 0;

DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'campaign_jobs'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE campaign_jobs DROP CONSTRAINT IF EXISTS %I', constraint_row.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaign_jobs_status_check'
  ) THEN
    ALTER TABLE campaign_jobs
      ADD CONSTRAINT campaign_jobs_status_check
      CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'retry_scheduled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_status
  ON campaign_jobs(status);

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_queue_job_id
  ON campaign_jobs(queue_job_id);
