import type { FastifyInstance } from 'fastify';
import { pool } from '../../config/db.js';
import { plivoService, plivoIsConfigured } from './plivo.service.js';

/**
 * Numbers Routes — Twilio-Only Telephony Integration
 * 
 * Provisions, lists, assigns, and releases phone numbers via Twilio API.
 * If TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in env, uses live Twilio.
 * Otherwise falls back to mock mode for development.
 */

// Helper: get Twilio client (lazy init)
let twilioClient: any = null;
const LIVE_INVENTORY_PROVIDERS = new Set(['twilio', 'plivo']);
const UNSUPPORTED_PROVIDERS = new Set(['exotel', 'mcube', 'vobiz']);

async function getTwilioClient(workspaceId?: string) {
    // First try workspace-level config from DB
    if (workspaceId) {
        try {
            const configResult = await pool.query(
                'SELECT account_sid, auth_token_encrypted FROM twilio_config WHERE workspace_id = $1 AND is_active = true',
                [workspaceId]
            );
            if (configResult.rows.length > 0) {
                const { account_sid, auth_token_encrypted } = configResult.rows[0];
                const twilio = (await import('twilio')).default;
                return twilio(account_sid, auth_token_encrypted);
            }
        } catch (e) {
            // Fall through to env vars
        }
    }

    // Fallback to env vars
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid && token) {
        if (!twilioClient) {
            const twilio = (await import('twilio')).default;
            twilioClient = twilio(sid, token);
        }
        return twilioClient;
    }

    return null; // Mock mode
}

async function getTwilioConnectionStatus(workspaceId: string) {
    try {
        const configResult = await pool.query(
            'SELECT id, account_sid, created_at FROM twilio_config WHERE workspace_id = $1 AND is_active = true LIMIT 1',
            [workspaceId]
        );

        if (configResult.rows.length > 0) {
            return {
                configured: true,
                mode: 'workspace',
                accountSid: configResult.rows[0].account_sid,
                connectedAt: configResult.rows[0].created_at,
            };
        }
    } catch {
        // Fall through to env check
    }

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        return {
            configured: true,
            mode: 'env',
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            connectedAt: null,
        };
    }

    return {
        configured: false,
        mode: 'not_configured',
        accountSid: null,
        connectedAt: null,
    };
}

async function getTataTeleConfig(workspaceId: string) {
    try {
        const configResult = await pool.query(
            'SELECT api_key, api_secret, account_id, base_url FROM tata_tele_config WHERE workspace_id = $1',
            [workspaceId]
        );
        if (configResult.rows.length > 0) {
            return configResult.rows[0];
        }
    } catch (e) {
        // Fall back
    }
    return null;
}

async function getProviderCatalog(workspaceId: string) {
    const [twilioStatus, tataTeleConfig] = await Promise.all([
        getTwilioConnectionStatus(workspaceId),
        getTataTeleConfig(workspaceId),
    ]);

    return [
        {
            id: 'twilio',
            name: 'Twilio',
            status: twilioStatus.configured ? twilioStatus.mode : 'not_configured',
            supportsInventory: true,
            supportsProvision: true,
            supportsLocal: true,
            supportsTollFree: true,
            note: twilioStatus.configured
                ? 'Live search and provisioning are available.'
                : 'Add workspace or env Twilio credentials to search and provision numbers.',
        },
        {
            id: 'plivo',
            name: 'Plivo',
            status: plivoIsConfigured() ? 'configured' : 'not_configured',
            supportsInventory: true,
            supportsProvision: true,
            supportsLocal: true,
            supportsTollFree: true,
            note: plivoIsConfigured()
                ? 'Live search and provisioning are available.'
                : 'Add PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, and PLIVO_APP_ID to enable live inventory.',
        },
        {
            id: 'tatatele',
            name: 'Tata Tele',
            status: tataTeleConfig ? 'partial' : 'not_configured',
            supportsInventory: false,
            supportsProvision: false,
            supportsLocal: true,
            supportsTollFree: true,
            note: tataTeleConfig
                ? 'Credentials can be stored, but live number search and provisioning are not implemented yet.'
                : 'Provider shell exists, but live Tata Tele inventory support is not implemented yet.',
        },
        {
            id: 'exotel',
            name: 'Exotel',
            status: 'coming_soon',
            supportsInventory: false,
            supportsProvision: false,
            supportsLocal: false,
            supportsTollFree: false,
            note: 'Exotel API integration is not implemented yet.',
        },
        {
            id: 'mcube',
            name: 'Mcube',
            status: 'coming_soon',
            supportsInventory: false,
            supportsProvision: false,
            supportsLocal: false,
            supportsTollFree: false,
            note: 'Mcube API integration is not implemented yet.',
        },
        {
            id: 'vobiz',
            name: 'Vobiz',
            status: 'coming_soon',
            supportsInventory: false,
            supportsProvision: false,
            supportsLocal: false,
            supportsTollFree: false,
            note: 'Vobiz API integration is not implemented yet.',
        },
        {
            id: 'byot',
            name: 'Bring Your Own Number',
            status: 'manual',
            supportsInventory: false,
            supportsProvision: false,
            supportsLocal: true,
            supportsTollFree: true,
            note: 'Use call forwarding, SIP trunking, or submit a port request. Direct provider-side verification is not implemented yet.',
        },
    ];
}

// Mock number generator for development (when no Twilio creds)
function generateMockNumber(countryCode: string): string {
    const rand = Math.floor(Math.random() * 9000000000 + 1000000000);
    const prefix = countryCode === 'IN' ? '+91' : countryCode === 'UK' ? '+44' : '+1';
    return `${prefix}${rand}`;
}

export default async function numbersRoutes(app: FastifyInstance) {

    app.get('/providers', async (request, reply) => {
        try {
            const { orgId } = request.query as { orgId: string };
            if (!orgId) {
                return reply.status(400).send({ error: 'orgId is required' });
            }

            return {
                providers: await getProviderCatalog(orgId),
            };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // List all numbers for workspace
    app.get('/', async (request, reply) => {
        try {
            const { orgId } = request.query as { orgId: string };
            const result = await pool.query(
                `SELECT n.*, va.name as agent_name
                 FROM phone_numbers n
                 LEFT JOIN voice_agents va ON va.id = n.assigned_agent_id
                 WHERE n.workspace_id = $1
                 ORDER BY n.created_at DESC`,
                [orgId]
            );
            return result.rows;
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Search available numbers from Twilio
    const getBasePrice = (country: string) => {
        const c = (country || 'US').toUpperCase();
        if (c === 'IN') return 150; // Approx ₹150 base
        if (c === 'GB' || c === 'UK') return 180;
        return 100; // US ~$1.25 base
    };

    app.get('/available', async (request, reply) => {
        try {
            const { orgId, countryCode, type, provider, limit = '20', offset = '0' } = request.query as any;
            const limitNum = Number(limit);
            const offsetNum = Number(offset);
            const selectedProvider = String(provider || 'twilio').toLowerCase();

            let isConfigured = true;

            if (UNSUPPORTED_PROVIDERS.has(selectedProvider)) {
                return {
                    numbers: [],
                    total: 0,
                    isConfigured: false,
                    providerStatus: 'coming_soon',
                    error: `${selectedProvider} inventory search is not implemented yet.`,
                };
            }

            if (selectedProvider === 'tatatele') {
                const config = await getTataTeleConfig(orgId);

                return {
                    numbers: [],
                    total: 0,
                    isConfigured: Boolean(config),
                    providerStatus: 'partial',
                    error: 'Tata Tele inventory search is not implemented yet.',
                };
            }

            if (selectedProvider === 'plivo') {
                isConfigured = plivoIsConfigured();
                const plivoRes = await plivoService.searchNumbers(countryCode || 'IN', type || 'local', limitNum, offsetNum);
                
                if (!plivoRes) {
                    // Mock Plivo numbers for testing
                    const mockNumbers = Array.from({ length: limitNum }, () => ({
                        phoneNumber: `+1800${Math.floor(1000000 + Math.random() * 9000000)}`,
                        friendlyName: `Plivo ${type || 'local'} number`,
                        region: countryCode || 'US',
                        capabilities: { voice: true, sms: true },
                        price: getBasePrice(countryCode) + 100
                    }));
                    return { numbers: mockNumbers, total: 100, isConfigured };
                }
                
                const mapped = plivoRes.numbers.map((n: any) => ({
                    phoneNumber: n.number,
                    friendlyName: n.number,
                    region: countryCode || 'US',
                    capabilities: { voice: true, sms: true },
                    price: getBasePrice(countryCode) + 100
                }));

                return { numbers: mapped, total: plivoRes.total, isConfigured };
            }

            if (!LIVE_INVENTORY_PROVIDERS.has(selectedProvider)) {
                return {
                    numbers: [],
                    total: 0,
                    isConfigured: false,
                    providerStatus: 'coming_soon',
                    error: `${selectedProvider} inventory search is not available.`,
                };
            }

            const client = await getTwilioClient(orgId);
            isConfigured = client !== null;
            
            if (!client) {
                // Mock mode — return sample numbers
                const mockNumbers = Array.from({ length: limitNum }, () => ({
                    phoneNumber: generateMockNumber(countryCode || 'US'),
                    friendlyName: `Mock ${type || 'local'} number`,
                    region: countryCode || 'US',
                    capabilities: { voice: true, sms: true },
                    price: getBasePrice(countryCode) + 100
                }));
                return { numbers: mockNumbers, total: 100, isConfigured: false };
            }

            // Live Twilio search
            const country = countryCode || 'US';
            const searchType = type === 'toll-free' ? 'tollFree' : 'local';
            const available = await client.availablePhoneNumbers(country)[searchType].list({ limit: limitNum });
            
            const mapped = available.map((n: any) => ({
                phoneNumber: n.phoneNumber,
                friendlyName: n.friendlyName,
                region: n.region,
                capabilities: n.capabilities,
                price: getBasePrice(country) + 100
            }));

            return { numbers: mapped, total: 100, isConfigured: true }; // Twilio direct lists do not strictly yield precise absolute totals without separate paging counts
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Provision a new number
    app.post('/provision', async (request, reply) => {
        try {
            const { orgId, countryCode, type, phoneNumber, provider } = request.body as any;
            const selectedProvider = String(provider || 'twilio').toLowerCase();

            if (UNSUPPORTED_PROVIDERS.has(selectedProvider)) {
                return reply.status(400).send({
                    error: `${selectedProvider} number provisioning is not implemented yet.`,
                    code: 'PROVIDER_NOT_SUPPORTED',
                });
            }

            if (selectedProvider === 'tatatele') {
                return reply.status(400).send({
                    error: 'Tata Tele provisioning is not implemented yet.',
                    code: 'PROVIDER_NOT_SUPPORTED',
                });
            }

            if (selectedProvider === 'plivo') {
                // Rent from Plivo
                await plivoService.rentNumber(phoneNumber);
                
                const result = await pool.query(
                    `INSERT INTO phone_numbers (workspace_id, number, country_code, type, provider, status)
                     VALUES ($1, $2, $3, $4, 'plivo', 'active') RETURNING *`,
                    [orgId, phoneNumber, countryCode || 'US', type || 'local']
                );
                return result.rows[0];
            }

            if (!LIVE_INVENTORY_PROVIDERS.has(selectedProvider)) {
                return reply.status(400).send({
                    error: `${selectedProvider} number provisioning is not available.`,
                    code: 'PROVIDER_NOT_SUPPORTED',
                });
            }

            const client = await getTwilioClient(orgId);

            let provisionedNumber: string;

            if (client && phoneNumber) {
                // Live Twilio: buy the specific number
                try {
                    const purchased = await client.incomingPhoneNumbers.create({
                        phoneNumber: phoneNumber,
                        voiceUrl: `${process.env.BACKEND_URL || 'https://your-backend.com'}/api/orchestrator/voice`,
                        voiceMethod: 'POST'
                    });
                    provisionedNumber = purchased.phoneNumber;
                } catch (twilioErr: any) {
                    return reply.status(400).send({ 
                        error: `Twilio error: ${twilioErr.message}`,
                        code: 'TWILIO_PROVISION_FAILED'
                    });
                }
            } else {
                // Mock mode
                provisionedNumber = generateMockNumber(countryCode || 'US');
            }

            const result = await pool.query(
                `INSERT INTO phone_numbers (workspace_id, number, country_code, type, provider)
                 VALUES ($1,$2,$3,$4,'twilio') RETURNING *`,
                [orgId, provisionedNumber, countryCode || 'US', type || 'local']
            );
            return result.rows[0];
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Assign agent to number
    app.put('/:id/assign', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { agentId } = request.body as any;
            const result = await pool.query(
                'UPDATE phone_numbers SET assigned_agent_id=$1 WHERE id=$2 RETURNING *',
                [agentId, id]
            );
            return result.rows[0];
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Release a number
    app.delete('/:id', async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            
            // Get the number details first
            const numResult = await pool.query('SELECT * FROM phone_numbers WHERE id = $1', [id]);
            if (numResult.rows.length === 0) {
                return reply.status(404).send({ error: 'Number not found' });
            }

            const num = numResult.rows[0];

            if (num.provider === 'own' || num.provider === 'plivo' || num.provider === 'tatatele' || num.provider === 'byot') {
                if (num.provider === 'plivo') {
                    await plivoService.releaseNumber(num.number);
                }
                await pool.query('DELETE FROM phone_numbers WHERE id = $1', [id]);
                return { success: true };
            }

            const client = await getTwilioClient(num.workspace_id);

            // Try to release from Twilio
            if (client) {
                try {
                    const twilioNumbers = await client.incomingPhoneNumbers.list({ phoneNumber: num.number });
                    if (twilioNumbers.length > 0) {
                        await client.incomingPhoneNumbers(twilioNumbers[0].sid).remove();
                    }
                } catch (twilioErr: any) {
                    console.warn('Twilio release warning:', twilioErr.message);
                    // Continue to delete from DB anyway
                }
            }

            await pool.query('DELETE FROM phone_numbers WHERE id = $1', [id]);
            return { success: true };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Connect user's own number (BYON)
    app.post('/connect-own', async (request, reply) => {
        try {
            const { orgId, phoneNumber, countryCode } = request.body as any;
            if (!orgId || !phoneNumber) {
                return reply.status(400).send({ error: 'Workspace ID and Phone Number are required' });
            }

            const existing = await pool.query(
                'SELECT id FROM phone_numbers WHERE number = $1 LIMIT 1',
                [phoneNumber]
            );
            if (existing.rows.length > 0) {
                return reply.status(409).send({ error: 'This number is already registered.' });
            }

            const result = await pool.query(
                `INSERT INTO phone_numbers (workspace_id, number, country_code, type, provider, status, connection_type)
                 VALUES ($1, $2, $3, 'local', 'byot', 'pending', 'verification_pending') RETURNING *`,
                [orgId, phoneNumber, countryCode || 'US']
            );

            return {
                success: true,
                data: result.rows[0],
                message: 'Number registered as pending. Complete call forwarding, SIP setup, or porting before using it live.',
            };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Save SIP credentials for BYOT
    app.post('/connect-sip', async (request, reply) => {
        try {
            const { workspaceId, sipDomain, username, password, port, existingNumber } = request.body as any;
            
            // Test SIP connection logic would realistically go here
            
            // Save to phone_numbers with type='sip'
            const result = await pool.query(
                `INSERT INTO phone_numbers 
                 (workspace_id, number, provider, status, connection_type, sip_config)
                 VALUES ($1, $2, 'byot', 'active', 'sip', $3) RETURNING *`,
                [workspaceId, existingNumber, JSON.stringify({ sipDomain, username, password, port })]
            );
            
            return { success: true, data: result.rows[0] };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Call forwarding — just save the number as forwarded
    app.post('/connect-forwarding', async (request, reply) => {
        try {
            const { workspaceId, existingNumber, qestronNumber } = request.body as any;
            
            const result = await pool.query(
                `INSERT INTO phone_numbers 
                 (workspace_id, number, provider, status, connection_type, forwarded_to)
                 VALUES ($1, $2, 'byot', 'active', 'forwarding', $3) RETURNING *`,
                [workspaceId, existingNumber, qestronNumber]
            );
            
            return { 
                success: true,
                data: result.rows[0],
                instructions: `Set call forwarding on your phone to: ${qestronNumber}`
            };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    app.post('/port-request', async (request, reply) => {
        try {
            const { workspaceId, existingNumber, currentProvider, accountNumber } = request.body as any;

            if (!workspaceId || !existingNumber) {
                return reply.status(400).send({ error: 'workspaceId and existingNumber are required' });
            }

            const result = await pool.query(
                `INSERT INTO number_port_requests (workspace_id, phone_number, current_provider, account_number, status)
                 VALUES ($1, $2, $3, $4, 'requested')
                 RETURNING *`,
                [workspaceId, existingNumber, currentProvider || null, accountNumber || null]
            );

            return {
                success: true,
                data: result.rows[0],
                message: 'Port request submitted. This remains a manual carrier workflow until provider-side automation is added.',
            };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Save Twilio credentials for workspace
    app.post('/connect', async (request, reply) => {
        try {
            const { orgId, accountSid, authToken } = request.body as any;
            
            if (!accountSid || !authToken) {
                return reply.status(400).send({ error: 'Account SID and Auth Token are required' });
            }

            // Verify credentials by making a test call to Twilio
            try {
                const twilio = (await import('twilio')).default;
                const testClient = twilio(accountSid, authToken);
                await testClient.api.accounts(accountSid).fetch();
            } catch (twilioErr: any) {
                return reply.status(400).send({ 
                    error: 'Invalid Twilio credentials',
                    details: twilioErr.message
                });
            }

            // Upsert config
            await pool.query(
                `INSERT INTO twilio_config (workspace_id, account_sid, auth_token_encrypted)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (workspace_id) 
                 DO UPDATE SET account_sid = $2, auth_token_encrypted = $3, updated_at = NOW()`,
                [orgId, accountSid, authToken]
            );

            return { success: true, message: 'Twilio connected successfully' };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });

    // Get Twilio connection status
    app.get('/connection-status', async (request, reply) => {
        try {
            const { orgId } = request.query as { orgId: string };
            const result = await pool.query(
                'SELECT id, account_sid, is_active, created_at FROM twilio_config WHERE workspace_id = $1',
                [orgId]
            );
            
            if (result.rows.length === 0) {
                return { connected: false, mode: process.env.TWILIO_ACCOUNT_SID ? 'env' : 'mock' };
            }

            return { 
                connected: true, 
                mode: 'workspace',
                accountSid: result.rows[0].account_sid,
                connectedAt: result.rows[0].created_at
            };
        } catch (e: any) {
            reply.status(500).send({ error: e.message });
        }
    });
}
