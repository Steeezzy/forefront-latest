-- Widget embedding domains (whitelist where widget can load)
CREATE TABLE IF NOT EXISTS widget_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    domain VARCHAR(500) NOT NULL,
    verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_method VARCHAR(50) DEFAULT 'dns_txt',
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, domain)
);
CREATE INDEX IF NOT EXISTS idx_widget_domains_workspace ON widget_domains(workspace_id);
CREATE INDEX IF NOT EXISTS idx_widget_domains_domain ON widget_domains(domain);

-- Custom branded domains (e.g. support.theirdomain.com)
CREATE TABLE IF NOT EXISTS custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    domain VARCHAR(500) NOT NULL UNIQUE,
    target_type VARCHAR(50) DEFAULT 'chat_page',
    verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    cname_target VARCHAR(255) DEFAULT 'custom.antigravity.com',
    ssl_status VARCHAR(50) DEFAULT 'pending',
    ssl_expires_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_workspace ON custom_domains(workspace_id);

-- Email sending domains (SPF/DKIM/DMARC verification)
CREATE TABLE IF NOT EXISTS email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    domain VARCHAR(500) NOT NULL,
    spf_verified BOOLEAN DEFAULT false,
    dkim_verified BOOLEAN DEFAULT false,
    dmarc_verified BOOLEAN DEFAULT false,
    dkim_selector VARCHAR(100) DEFAULT 'antigravity',
    dkim_public_key TEXT,
    dkim_private_key TEXT,
    required_records JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, domain)
);
CREATE INDEX IF NOT EXISTS idx_email_domains_workspace ON email_domains(workspace_id);
