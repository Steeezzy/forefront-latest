-- Migration 049: Bookings System
-- Availability slots and bookings for appointment scheduling

CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID,
  workspace_id VARCHAR(100) NOT NULL,
  slot_date DATE NOT NULL,
  slot_start TIMESTAMP NOT NULL,
  slot_end TIMESTAMP NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  booked_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id VARCHAR(100) NOT NULL,
  session_id UUID,
  slot_id UUID REFERENCES availability_slots(id),
  customer_phone VARCHAR(20),
  customer_name VARCHAR(100),
  customer_email VARCHAR(200),
  service_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'confirmed',
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slots_workspace ON availability_slots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON availability_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_slots_agent ON availability_slots(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_workspace ON bookings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(customer_phone);
