-- UP Migration (037_add_agent_config_columns.sql)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tone VARCHAR(255) DEFAULT 'helpful';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS goal VARCHAR(1000) DEFAULT 'answer questions';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
