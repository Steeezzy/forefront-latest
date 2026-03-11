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
export declare class DomainService {
    private generateToken;
    checkDnsTxt(domain: string, expectedToken: string): Promise<boolean>;
    checkCname(domain: string, expectedTarget: string): Promise<boolean>;
    listWidgetDomains(workspaceId: string): Promise<WidgetDomain[]>;
    addWidgetDomain(workspaceId: string, domain: string): Promise<WidgetDomain>;
    removeWidgetDomain(workspaceId: string, domainId: string): Promise<void>;
    verifyWidgetDomain(workspaceId: string, domainId: string): Promise<{
        verified: boolean;
        domain: WidgetDomain;
    }>;
    isWidgetAllowed(workspaceId: string, origin: string): Promise<boolean>;
    listCustomDomains(workspaceId: string): Promise<CustomDomain[]>;
    addCustomDomain(workspaceId: string, domain: string): Promise<CustomDomain>;
    removeCustomDomain(workspaceId: string, domainId: string): Promise<void>;
    verifyCustomDomain(workspaceId: string, domainId: string): Promise<{
        verified: boolean;
        domain: CustomDomain;
    }>;
    resolveCustomDomain(hostname: string): Promise<string | null>;
    listEmailDomains(workspaceId: string): Promise<EmailDomain[]>;
    addEmailDomain(workspaceId: string, domain: string): Promise<EmailDomain>;
    removeEmailDomain(workspaceId: string, domainId: string): Promise<void>;
    getEmailDomainRecords(workspaceId: string, domainId: string): Promise<DnsRecord[]>;
    verifyEmailDomain(workspaceId: string, domainId: string): Promise<EmailDomain>;
}
//# sourceMappingURL=domain.service.d.ts.map