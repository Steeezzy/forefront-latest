-- Migration 089: campaign_jobs state + reliability layer

ALTER TABLE campaign_jobs
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS queue_job_id TEXT;

-- Backfill reliability fields from legacy columns when available.
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

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'campaign_jobs'
      AND column_name = 'last_error'
  ) THEN
    UPDATE campaign_jobs
    SET error_message = last_error
    WHERE (error_message IS NULL OR error_message = '')
      AND last_error IS NOT NULL
      AND last_error <> '';
  END IF;
END $$;

-- Strict status normalization.
UPDATE campaign_jobs
SET status = CASE
  WHEN status = 'in_progress' THEN 'processing'
  WHEN status = 'scheduled' THEN 'retry_scheduled'
  WHEN status IN ('queued', 'processing', 'completed', 'failed', 'retry_scheduled') THEN status
  ELSE 'queued'
END;

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

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_status_reliability
  ON campaign_jobs(status);

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_queue_job_id
  ON campaign_jobs(queue_job_id);
