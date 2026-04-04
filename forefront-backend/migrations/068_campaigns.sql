ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'sms',
  ADD COLUMN IF NOT EXISTS message_template TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivered INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responded INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

UPDATE campaigns
SET channel = COALESCE(NULLIF(channel, ''), 'sms')
WHERE channel IS NULL OR channel = '';

UPDATE campaigns
SET message_template = COALESCE(message_template, '')
WHERE message_template IS NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace
  ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status
  ON campaigns(status);

ALTER TABLE campaign_contacts
  ADD COLUMN IF NOT EXISTS personalization_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS response TEXT,
  ADD COLUMN IF NOT EXISTS twilio_sid TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign
  ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status
  ON campaign_contacts(status);
