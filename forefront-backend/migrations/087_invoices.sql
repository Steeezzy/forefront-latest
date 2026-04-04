-- Migration 087: Invoicing System
-- Depends on: customers table

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft, sent, paid, overdue, cancelled
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 18,  -- GST 18%
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  notes TEXT,
  payment_link VARCHAR(500),
  stripe_invoice_id VARCHAR(100),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward compatibility for legacy invoices schema from base schema.sql
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(30),
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS total NUMERIC,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS payment_link VARCHAR(500),
  ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE invoices
SET invoice_number = COALESCE(invoice_number, 'INV-' || UPPER(SUBSTRING(id::text, 1, 8)))
WHERE invoice_number IS NULL OR invoice_number = '';

UPDATE invoices
SET subtotal = COALESCE(subtotal, amount, 0),
    tax_rate = COALESCE(tax_rate, 18),
    tax_amount = COALESCE(tax_amount, 0),
    total = COALESCE(total, amount, 0),
    metadata = COALESCE(metadata, '{}'::jsonb),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE subtotal IS NULL
   OR tax_rate IS NULL
   OR tax_amount IS NULL
   OR total IS NULL
   OR metadata IS NULL
   OR updated_at IS NULL;

ALTER TABLE invoices
  ALTER COLUMN invoice_number SET NOT NULL,
  ALTER COLUMN subtotal SET DEFAULT 0,
  ALTER COLUMN tax_rate SET DEFAULT 18,
  ALTER COLUMN tax_amount SET DEFAULT 0,
  ALTER COLUMN total SET DEFAULT 0,
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_inv_number ON invoices(workspace_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_inv_workspace ON invoices(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_inv_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_inv_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_inv_due ON invoices(due_date) WHERE status IN ('sent', 'overdue');

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ii_invoice ON invoice_items(invoice_id);

-- Invoice number sequence per workspace
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1001;
