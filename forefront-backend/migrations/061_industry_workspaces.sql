-- 061_industry_workspaces.sql

ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS industry_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'US/Eastern',
ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'en-IN',
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS voice_agent_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS voice_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS greeting TEXT,
ADD COLUMN IF NOT EXISTS after_hours_message TEXT,
ADD COLUMN IF NOT EXISTS chatbot_title VARCHAR(100),
ADD COLUMN IF NOT EXISTS chatbot_welcome TEXT,
ADD COLUMN IF NOT EXISTS chatbot_personality TEXT,
ADD COLUMN IF NOT EXISTS chatbot_temperature FLOAT DEFAULT 0.3,
ADD COLUMN IF NOT EXISTS collect_leads BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS departments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_chats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS appointments_booked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS leads_captured INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue_influenced FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_savings FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS knowledge_entries JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS enabled_voice_templates JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS enabled_chat_templates JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS connected_integrations JSONB DEFAULT '[]';

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  direction VARCHAR(20),
  caller_name VARCHAR(255),
  caller_phone VARCHAR(50),
  duration INTEGER DEFAULT 0,
  outcome VARCHAR(50),
  template_used VARCHAR(100),
  transcript TEXT,
  language_detected VARCHAR(20),
  sentiment VARCHAR(50),
  revenue_attributed FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  visitor_name VARCHAR(255),
  visitor_email VARCHAR(255),
  messages_count INTEGER DEFAULT 0,
  outcome VARCHAR(50),
  lead_captured BOOLEAN DEFAULT false,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicine_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(50) NOT NULL,
  medicine_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  schedule_times JSONB,
  duration_days INTEGER,
  instructions TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  total_doses INTEGER DEFAULT 0,
  doses_taken INTEGER DEFAULT 0,
  doses_missed INTEGER DEFAULT 0,
  compliance_rate FLOAT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dose_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reminder_id UUID NOT NULL REFERENCES medicine_reminders(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  actual_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending',
  method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS followup_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(50) NOT NULL,
  doctor_name VARCHAR(255),
  reason TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  reminder_sent_24h BOOLEAN DEFAULT false,
  reminder_sent_2h BOOLEAN DEFAULT false,
  confirmed BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manual_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entry_type VARCHAR(50),
  data JSONB,
  revenue FLOAT DEFAULT 0,
  source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
