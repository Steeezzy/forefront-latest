-- UP Migration (054_add_byot_columns.sql)
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS connection_type VARCHAR(50) DEFAULT 'plivo',
ADD COLUMN IF NOT EXISTS sip_config JSONB,
ADD COLUMN IF NOT EXISTS forwarded_to VARCHAR(20);

-- DOWN Migration (rollback_054_add_byot_columns.sql)
-- ALTER TABLE phone_numbers DROP COLUMN connection_type;
-- ALTER TABLE phone_numbers DROP COLUMN sip_config;
-- ALTER TABLE phone_numbers DROP COLUMN forwarded_to;
