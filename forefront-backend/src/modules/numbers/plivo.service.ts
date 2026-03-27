import plivo from 'plivo';

// Lazy client setup to avoid crash if env vars are missing on startup
let plivoClient: any = null;

const getClient = () => {
    const authId = process.env.PLIVO_AUTH_ID;
    const authToken = process.env.PLIVO_AUTH_TOKEN;
    if (authId && authToken && authId !== 'your_auth_id_here') {
        if (!plivoClient) {
            plivoClient = new plivo.Client(authId, authToken);
        }
        return plivoClient;
    }
    return null;
};

export const plivoIsConfigured = () => {
    return getClient() !== null;
};

export const plivoService = {
  // Search available numbers
  async searchNumbers(countryISO: string, type: string = 'local', limit: number = 20, offset: number = 0) {
    const client = getClient();
    if (!client) return null; // Fallback to mock mode in router
    
    const response = await client.numbers.search(countryISO, {
      type,
      limit,
      offset,
    });
    return {
        numbers: response.objects || [],
        total: response.meta?.total_count || response.objects?.length || 0
    };
  },

  // Rent a number
  async rentNumber(phoneNumber: string) {
    const client = getClient();
    if (!client) throw new Error("Plivo credentials not configured for live purchase");

    const response = await client.numbers.buy(phoneNumber, {
      app_id: process.env.PLIVO_APP_ID
    });
    return response;
  },

  // List all rented numbers
  async listNumbers() {
    const client = getClient();
    if (!client) return [];

    const response = await client.numbers.list();
    return response.objects;
  },

  // Release a number
  async releaseNumber(phoneNumber: string) {
    const client = getClient();
    if (!client) return { success: true };

    await client.numbers.delete(phoneNumber);
    return { success: true };
  },

  // Assign number to agent (via Plivo Application)
  async assignToAgent(phoneNumber: string, webhookUrl: string) {
    const client = getClient();
    if (!client) return { success: true };

    await client.numbers.update(phoneNumber, {
      app_id: process.env.PLIVO_APP_ID,
      voice_url: webhookUrl,
    });
    return { success: true };
  }
};
