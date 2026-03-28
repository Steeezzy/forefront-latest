-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Templates table: stores all agent blueprints
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry_id VARCHAR(100) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound', 'webcall')),
    mode VARCHAR(20) NOT NULL DEFAULT 'single' CHECK (mode IN ('single', 'multi')),
    icon VARCHAR(100) NOT NULL,
    eyebrow TEXT,
    summary TEXT NOT NULL,
    outcome TEXT NOT NULL,
    first_message TEXT NOT NULL,
    objective TEXT,
    guidelines JSONB DEFAULT '[]',
    variables JSONB DEFAULT '[]',
    primary_language VARCHAR(50) NOT NULL DEFAULT 'en-IN',
    secondary_language VARCHAR(50),
    voice VARCHAR(100) DEFAULT 'sarvam-tanya',
    workflow JSONB, -- For multi-prompt templates (specialists, steps)
    config_schema JSONB DEFAULT '{}', -- JSON Schema for business config fields
    required_integrations JSONB DEFAULT '[]', -- Array of integration types needed
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT templates_industry_direction_idx UNIQUE NULLS NOT DISTINCT (industry_id, direction, name)
);

-- Template versions (for tracking changes and rollouts)
CREATE TABLE IF NOT EXISTS template_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    change_summary TEXT,
    config_snapshot JSONB NOT NULL, -- Full template state at this version
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(template_id, version_number)
);

-- Template industry definitions (for navigation)
CREATE TABLE IF NOT EXISTS industries (
    id VARCHAR(100) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL,
    accent_from VARCHAR(20) DEFAULT '#111827',
    accent_to VARCHAR(20) DEFAULT '#4b5563',
    surface VARCHAR(20) DEFAULT '#f8fafc',
    border VARCHAR(20) DEFAULT '#d4d4d8',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default industries (30)
INSERT INTO industries (id, label, description, icon) VALUES
('medical', 'Medical & Healthcare', 'Missed calls = missed patients. Your clinic needs 24/7 answering.', 'Stethoscope'),
('salon', 'Salons & Spas', 'Keep clients coming back with intelligent booking and follow-up.', 'Sparkles'),
('plumbing', 'Plumbing & HVAC', 'Never miss an emergency call. Dispatch technicians instantly.', 'Wrench'),
('hotel', 'Hotels & B&Bs', 'Handle reservations, guest requests, and check-ins automatically.', 'Hotel'),
('restaurant', 'Restaurants & Cafés', 'Take reservations, answer menu questions, and confirm delivery.', 'UtensilsCrossed'),
('auto', 'Auto Repair & Detailing', 'Schedule appointments, provide quotes, and send service reminders.', 'Car'),
('fitness', 'Gyms & Fitness Studios', 'Manage class bookings, membership inquiries, and follow-ups.', 'Dumbbell'),
('veterinary', 'Veterinary & Pet Services', 'Appointment scheduling, vaccine reminders, and emergency triage.', 'HeartPulse'),
('realestate', 'Real Estate', 'Qualify leads, schedule showings, and answer property questions.', 'Home'),
('law', 'Law Firms', 'Capture leads, schedule consultations, and manage intake.', 'Briefcase'),
('insurance', 'Insurance', 'Process claims, answer policy questions, and send reminders.', 'ShieldCheck'),
('logistics', 'Logistics & Courier', 'Track shipments, schedule pickups, and provide status updates.', 'Truck'),
('driving', 'Driving Schools', 'Book lessons, answer FAQs, and send reminders.', 'Car'),
('cleaning', 'Cleaning Services', 'Schedule cleanings, provide quotes, and confirm appointments.', 'SprayBottle'),
('events', 'Event Venues', 'Manage event bookings, vendor coordination, and guest inquiries.', 'Calendar'),
('education', 'Tutoring & Education', 'Schedule sessions, answer course questions, and track progress.', 'GraduationCap'),
('itsupport', 'IT Support', 'Triage tickets, provide solutions, and escalate emergencies.', 'Cpu'),
('funeral', 'Funeral Homes', 'Handle sensitive inquiries with compassion and accuracy.', 'Flower2'), -- Generic placeholder
('recruitment', 'Recruitment', 'Screen candidates, schedule interviews, and answer FAQs.', 'Users'),
('retail', 'Retail & E-commerce', 'Answer product questions, track orders, and process returns.', 'ShoppingBag')
ON CONFLICT (id) DO NOTHING;

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_templates_industry_id ON templates(industry_id);
CREATE INDEX IF NOT EXISTS idx_templates_direction ON templates(direction);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_mode ON templates(mode);

-- Migration comment
COMMENT ON TABLE templates IS 'Stores agent blueprints/templates that businesses can configure and deploy.';
COMMENT ON COLUMN templates.workflow IS 'For multi-prompt templates: contains specialist agents, handoff rules, and prompt flow.';
COMMENT ON COLUMN templates.config_schema IS 'JSON Schema defining business-specific config fields (e.g., services, hours, staff).';
