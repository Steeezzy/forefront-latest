-- Migration 084: Queue Resilience — Dead Letter Jobs + Queue Metrics
-- Dependencies: None (standalone tables)

-- Dead letter jobs: permanently failed jobs moved here for manual review/retry
CREATE TABLE IF NOT EXISTS dead_letter_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_queue VARCHAR(100) NOT NULL,
  original_job_id VARCHAR(200),
  original_job_name VARCHAR(200),
  workspace_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  failed_reason TEXT,
  attempts_made INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'dead',  -- dead, retried, discarded
  retried_at TIMESTAMPTZ,
  discarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dlj_queue ON dead_letter_jobs(original_queue);
CREATE INDEX IF NOT EXISTS idx_dlj_status ON dead_letter_jobs(status);
CREATE INDEX IF NOT EXISTS idx_dlj_workspace ON dead_letter_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dlj_created ON dead_letter_jobs(created_at DESC);

-- Queue metrics: periodic snapshots for dashboard charting
CREATE TABLE IF NOT EXISTS queue_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name VARCHAR(100) NOT NULL,
  active_count INTEGER DEFAULT 0,
  waiting_count INTEGER DEFAULT 0,
  delayed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qm_queue_time ON queue_metrics(queue_name, recorded_at DESC);

-- Scheduled jobs: generic scheduling table for cron-like jobs
-- (lead scoring, invoice reminders, review requests, data exports)
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  job_type VARCHAR(50) NOT NULL,
  schedule_cron VARCHAR(100),  -- e.g. '0 2 * * *' for 2 AM daily
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_status VARCHAR(20),  -- success, failed, running
  last_error TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sj_workspace ON scheduled_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sj_next_run ON scheduled_jobs(is_active, next_run_at)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sj_type ON scheduled_jobs(job_type);
