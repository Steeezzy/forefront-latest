import { pool } from '../../config/db.js';
import dns from 'dns/promises';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ───────────────────────────────────────────────────────────

export interface WidgetDomain {
    id: string;
    workspace_id: string;
    domain: string;
    verified: boolean;
    verification_token: string;
    verification_method: string;
    verified_at: string | null;
    created_at: string;
}

export interface CustomDomain {
    id: string;
    workspace_id: string;
    domain: string;
    target_type: string;
    verified: boolean;
    verification_token: string;
    cname_target: string;
    ssl_status: string;
    verified_at: string | null;
    created_at: string;
}

export interface EmailDomain {
    id: string;
    workspace_id: string;
    domain: string;
    spf_verified: boolean;
    dkim_verified: boolean;
    dmarc_verified: boolean;
    dkim_selector: string;
    dkim_public_key: string | null;
    required_records: DnsRecord[];
    status: string;
    verified_at: string | null;
    last_checked_at: string | null;
    created_at: string;
}

export interface DnsRecord {
    type: string;
    host: string;
    value: string;
    description: string;
    verified?: boolean;
}

// ─── Service ─────────────────────────────────────────────────────────

export class DomainService {

    // ─── Helpers ──────────────────────────────────────────────────────

    private generateToken(): string {
        return `antigravity-verify=${uuidv4()}`;
    }

    async checkDnsTxt(domain: string, expectedToken: string): Promise<boolean> {
        try {
            const records = await dns.resolveTxt(domain);
            const flat = records.flat();
            return flat.some(r => r.includes(expectedToken));
        } catch {
            return false;
        }
    }

    async checkCname(domain: string, expectedTarget: string): Promise<boolean> {
        try {
            const records = await dns.resolveCname(domain);
            return records.some(r => r.toLowerCase() === expectedTarget.toLowerCase());
        } catch {
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // WIDGET DOMAINS
    // ═══════════════════════════════════════════════════════════════════

    async listWidgetDomains(workspaceId: string): Promise<WidgetDomain[]> {
        const { rows } = await pool.query(
            `SELECT * FROM widget_domains WHERE workspace_id = $1 ORDER BY created_at DESC`,
            [workspaceId]
        );
        return rows;
    }

    async addWidgetDomain(workspaceId: string, domain: string): Promise<WidgetDomain> {
        const normalised = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
        const token = this.generateToken();

        const { rows } = await pool.query(
            `INSERT INTO widget_domains (workspace_id, domain, verification_token)
             VALUES ($1, $2, $3)
             ON CONFLICT (workspace_id, domain) DO UPDATE SET verification_token = $3, updated_at = NOW()
             RETURNING *`,
            [workspaceId, normalised, token]
        );
        return rows[0];
    }

    async removeWidgetDomain(workspaceId: string, domainId: string): Promise<void> {
        await pool.query(
            `DELETE FROM widget_domains WHERE id = $1 AND workspace_id = $2`,
            [domainId, workspaceId]
        );
    }

    async verifyWidgetDomain(workspaceId: string, domainId: string): Promise<{ verified: boolean; domain: WidgetDomain }> {
        const { rows } = await pool.query(
            `SELECT * FROM widget_domains WHERE id = $1 AND workspace_id = $2`,
            [domainId, workspaceId]
        );
        if (!rows[0]) throw new Error('Domain not found');

        const d = rows[0] as WidgetDomain;
        const verified = await this.checkDnsTxt(d.domain, d.verification_token);

        if (verified) {
            const { rows: updated } = await pool.query(
                `UPDATE widget_domains SET verified = true, verified_at = NOW(), updated_at = NOW()
                 WHERE id = $1 RETURNING *`,
                [domainId]
            );
            return { verified: true, domain: updated[0] };
        }

        return { verified: false, domain: d };
    }

    async isWidgetAllowed(workspaceId: string, origin: string): Promise<boolean> {
        const hostname = origin.replace(/^https?:\/\//, '').split(':')[0].toLowerCase();

        // localhost always allowed for development
        if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

        const { rows } = await pool.query(
            `SELECT domain FROM widget_domains WHERE workspace_id = $1 AND verified = true`,
            [workspaceId]
        );

        if (rows.length === 0) return true; // No domains configured → allow all (open by default)

        return rows.some((row: any) => {
            const pattern = row.domain;
            if (pattern.startsWith('*.')) {
                const base = pattern.slice(2);
                return hostname === base || hostname.endsWith('.' + base);
            }
            return hostname === pattern;
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    // CUSTOM BRANDED DOMAINS
    // ═══════════════════════════════════════════════════════════════════

    async listCustomDomains(workspaceId: string): Promise<CustomDomain[]> {
        const { rows } = await pool.query(
            `SELECT * FROM custom_domains WHERE workspace_id = $1 ORDER BY created_at DESC`,
            [workspaceId]
        );
        return rows;
    }

    async addCustomDomain(workspaceId: string, domain: string): Promise<CustomDomain> {
        const normalised = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
        const token = this.generateToken();

        const { rows } = await pool.query(
            `INSERT INTO custom_domains (workspace_id, domain, verification_token)
             VALUES ($1, $2, $3) RETURNING *`,
            [workspaceId, normalised, token]
        );
        return rows[0];
    }

    async removeCustomDomain(workspaceId: string, domainId: string): Promise<void> {
        await pool.query(
            `DELETE FROM custom_domains WHERE id = $1 AND workspace_id = $2`,
            [domainId, workspaceId]
        );
    }

    async verifyCustomDomain(workspaceId: string, domainId: string): Promise<{ verified: boolean; domain: CustomDomain }> {
        const { rows } = await pool.query(
            `SELECT * FROM custom_domains WHERE id = $1 AND workspace_id = $2`,
            [domainId, workspaceId]
        );
        if (!rows[0]) throw new Error('Domain not found');

        const d = rows[0] as CustomDomain;
        const txtDomain = `_antigravity.${d.domain}`;
        const txtOk = await this.checkDnsTxt(txtDomain, d.verification_token);
        const cnameOk = await this.checkCname(d.domain, d.cname_target);

        const verified = txtOk && cnameOk;

        if (verified) {
            const { rows: updated } = await pool.query(
                `UPDATE custom_domains SET verified = true, verified_at = NOW(), ssl_status = 'provisioning', updated_at = NOW()
                 WHERE id = $1 RETURNING *`,
                [domainId]
            );
            return { verified: true, domain: updated[0] };
        }

        return {
            verified: false,
            domain: {
                ...d,
                _checks: { txt: txtOk, cname: cnameOk }
            } as any
        };
    }

    async resolveCustomDomain(hostname: string): Promise<string | null> {
        const { rows } = await pool.query(
            `SELECT workspace_id FROM custom_domains WHERE domain = $1 AND verified = true`,
            [hostname.toLowerCase()]
        );
        return rows[0]?.workspace_id ?? null;
    }

    // ═══════════════════════════════════════════════════════════════════
    // EMAIL DOMAINS
    // ═══════════════════════════════════════════════════════════════════

    async listEmailDomains(workspaceId: string): Promise<EmailDomain[]> {
        const { rows } = await pool.query(
            `SELECT id, workspace_id, domain, spf_verified, dkim_verified, dmarc_verified,
                    dkim_selector, dkim_public_key, required_records, status,
                    verified_at, last_checked_at, created_at
             FROM email_domains WHERE workspace_id = $1 ORDER BY created_at DESC`,
            [workspaceId]
        );
        return rows;
    }

    async addEmailDomain(workspaceId: string, domain: string): Promise<EmailDomain> {
        const normalised = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');

        // Generate DKIM keypair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        const dkimPublicDns = publicKey
            .replace('-----BEGIN PUBLIC KEY-----', '')
            .replace('-----END PUBLIC KEY-----', '')
            .replace(/\n/g, '');

        const selector = 'antigravity';

        const requiredRecords: DnsRecord[] = [
            {
                type: 'TXT',
                host: '@',
                value: `v=spf1 include:mail.antigravity.com ~all`,
                description: 'SPF record — authorises Antigravity to send email on behalf of your domain',
            },
            {
                type: 'TXT',
                host: `${selector}._domainkey`,
                value: `v=DKIM1; k=rsa; p=${dkimPublicDns}`,
                description: 'DKIM record — cryptographically signs outgoing emails',
            },
            {
                type: 'TXT',
                host: '_dmarc',
                value: `v=DMARC1; p=none; rua=mailto:dmarc@antigravity.com`,
                description: 'DMARC record — instructs receiving servers how to handle failed auth',
            },
            {
                type: 'CNAME',
                host: 'bounce',
                value: 'bounce.antigravity.com',
                description: 'Return-path — handles email bounces',
            },
        ];

        const { rows } = await pool.query(
            `INSERT INTO email_domains (workspace_id, domain, dkim_selector, dkim_public_key, dkim_private_key, required_records)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (workspace_id, domain) DO UPDATE
                 SET dkim_public_key = $4, dkim_private_key = $5, required_records = $6, updated_at = NOW()
             RETURNING id, workspace_id, domain, spf_verified, dkim_verified, dmarc_verified,
                       dkim_selector, dkim_public_key, required_records, status,
                       verified_at, last_checked_at, created_at`,
            [workspaceId, normalised, selector, dkimPublicDns, privateKey, JSON.stringify(requiredRecords)]
        );
        return rows[0];
    }

    async removeEmailDomain(workspaceId: string, domainId: string): Promise<void> {
        await pool.query(
            `DELETE FROM email_domains WHERE id = $1 AND workspace_id = $2`,
            [domainId, workspaceId]
        );
    }

    async getEmailDomainRecords(workspaceId: string, domainId: string): Promise<DnsRecord[]> {
        const { rows } = await pool.query(
            `SELECT required_records FROM email_domains WHERE id = $1 AND workspace_id = $2`,
            [domainId, workspaceId]
        );
        if (!rows[0]) throw new Error('Domain not found');
        return rows[0].required_records;
    }

    async verifyEmailDomain(workspaceId: string, domainId: string): Promise<EmailDomain> {
        const { rows } = await pool.query(
            `SELECT * FROM email_domains WHERE id = $1 AND workspace_id = $2`,
            [domainId, workspaceId]
        );
        if (!rows[0]) throw new Error('Domain not found');

        const d = rows[0];
        const domain = d.domain;

        // Check SPF
        let spfVerified = false;
        try {
            const txtRecords = await dns.resolveTxt(domain);
            spfVerified = txtRecords.flat().some(r => r.includes('include:mail.antigravity.com'));
        } catch { /* not found */ }

        // Check DKIM
        let dkimVerified = false;
        try {
            const dkimHost = `${d.dkim_selector}._domainkey.${domain}`;
            const dkimRecords = await dns.resolveTxt(dkimHost);
            dkimVerified = dkimRecords.flat().some(r => r.includes(d.dkim_public_key?.substring(0, 40) || ''));
        } catch { /* not found */ }

        // Check DMARC
        let dmarcVerified = false;
        try {
            const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
            dmarcVerified = dmarcRecords.flat().some(r => r.includes('v=DMARC1'));
        } catch { /* not found */ }

        const allVerified = spfVerified && dkimVerified && dmarcVerified;
        const status = allVerified ? 'verified' : (spfVerified || dkimVerified || dmarcVerified) ? 'partial' : 'pending';

        // Update required_records with verification status
        const records = (d.required_records as DnsRecord[]).map(rec => {
            if (rec.host === '@' && rec.value.includes('spf1')) return { ...rec, verified: spfVerified };
            if (rec.host.includes('_domainkey')) return { ...rec, verified: dkimVerified };
            if (rec.host === '_dmarc') return { ...rec, verified: dmarcVerified };
            return rec;
        });

        const { rows: updated } = await pool.query(
            `UPDATE email_domains
             SET spf_verified = $1, dkim_verified = $2, dmarc_verified = $3,
                 status = $4, last_checked_at = NOW(), required_records = $5,
                 verified_at = CASE WHEN $4 = 'verified' THEN NOW() ELSE verified_at END,
                 updated_at = NOW()
             WHERE id = $6
             RETURNING id, workspace_id, domain, spf_verified, dkim_verified, dmarc_verified,
                       dkim_selector, dkim_public_key, required_records, status,
                       verified_at, last_checked_at, created_at`,
            [spfVerified, dkimVerified, dmarcVerified, status, JSON.stringify(records), domainId]
        );

        return updated[0];
    }
}
