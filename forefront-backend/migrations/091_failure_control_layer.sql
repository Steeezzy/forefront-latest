-- Migration 091: Failure control layer for campaign execution

ALTER TABLE campaign_jobs
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'campaign_jobs_failure_type_check'
  ) THEN
    ALTER TABLE campaign_jobs
      ADD CONSTRAINT campaign_jobs_failure_type_check
      CHECK (
        failure_type IS NULL OR
        failure_type IN ('network_error', 'ai_error', 'invalid_input', 'external_api_error', 'unknown')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_next_retry_at
  ON campaign_jobs(next_retry_at);

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_failure_type
  ON campaign_jobs(failure_type);

ALTER TABLE dead_letter_jobs
  ADD COLUMN IF NOT EXISTS campaign_job_id UUID,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ DEFAULT NOW();

UPDATE dead_letter_jobs
SET error_message = COALESCE(error_message, failed_reason)
WHERE error_message IS NULL;

UPDATE dead_letter_jobs
SET failed_at = COALESCE(failed_at, created_at)
WHERE failed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dlj_campaign_job
  ON dead_letter_jobs(campaign_job_id);

CREATE INDEX IF NOT EXISTS idx_dlj_failed_at
  ON dead_letter_jobs(failed_at DESC);
