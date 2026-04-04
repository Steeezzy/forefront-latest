-- Migration 088: Core workspace architecture alignment
-- Workspace -> Customers -> Interactions -> Appointments -> Events

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Workspaces core fields
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

UPDATE workspaces
SET industry = COALESCE(NULLIF(industry, ''), 'general')
WHERE industry IS NULL OR industry = '';

ALTER TABLE workspaces
  ALTER COLUMN industry SET DEFAULT 'general';

ALTER TABLE workspaces
  ALTER COLUMN industry SET NOT NULL;

-- 2) Customers core schema alignment
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  lead_score INT DEFAULT 0,
  lifecycle_stage TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customers'
      AND column_name = 'workspace_id'
      AND data_type <> 'uuid'
  ) THEN
    BEGIN
      ALTER TABLE customers
        ALTER COLUMN workspace_id TYPE UUID USING workspace_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not cast customers.workspace_id to UUID. Keeping existing type.';
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customers'
      AND column_name = 'workspace_id'
      AND data_type = 'uuid'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_customers_workspace'
  ) THEN
    BEGIN
      ALTER TABLE customers
        ADD CONSTRAINT fk_customers_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add fk_customers_workspace. Existing rows may violate FK.';
    END;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_workspace_phone
  ON customers(workspace_id, phone);

-- 3) Interactions memory table
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  channel TEXT,
  message TEXT,
  response TEXT,
  intent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_workspace
  ON interactions(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_customer
  ON interactions(customer_id, created_at DESC);

-- 4) Appointments booking table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  service TEXT,
  date TIMESTAMP,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_workspace_date
  ON appointments(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer
  ON appointments(customer_id, created_at DESC);

-- 5) Campaign jobs strict fields alignment (table already exists in many environments)
CREATE TABLE IF NOT EXISTS campaign_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT,
  attempts INT DEFAULT 0,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE campaign_jobs
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

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

-- 6) Generic events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_workspace
  ON events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type
  ON events(type);
