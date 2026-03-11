-- DOWN Migration (rollback_037_add_agent_config_columns.sql)
ALTER TABLE agents DROP COLUMN IF EXISTS tone;
ALTER TABLE agents DROP COLUMN IF EXISTS goal;
ALTER TABLE agents DROP COLUMN IF EXISTS is_active;
