/**
 * E-commerce Integration Providers
 *
 * Supports: WooCommerce, BigCommerce, Adobe Commerce (Magento), PrestaShop, WordPress
 *
 * Note: Shopify is already fully built in src/modules/shopify/
 *
 * These integrations primarily:
 * 1. Embed the Forefront chat widget on the store
 * 2. Sync customer data from orders → contacts
 * 3. Look up order status for customer service queries
 */

import { pool } from '../../../config/db.js';

export interface EcommerceOrder {
  orderId: string;
  email: string;
  customerName?: string;
  total: number;
  currency: string;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
}

export interface EcommerceCustomer {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  ordersCount?: number;
  totalSpent?: number;
}

// ============================================================
// WooCommerce
// ============================================================

export class WooCommerceProvider {
  private storeUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string) {
    this.storeUrl = storeUrl.replace(/\/$/, '');
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  private get authHeader() {
    return 'Basic ' + Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
  }

  async getOrder(orderId: string): Promise<EcommerceOrder | null> {
    try {
      const response = await fetch(`${this.storeUrl}/wp-json/wc/v3/orders/${orderId}`, {
        headers: { 'Authorization': this.authHeader },
      });
      if (!response.ok) return null;
      const data: any = await response.json();
      return {
        orderId: String(data.id),
        email: data.billing?.email || '',
        customerName: `${data.billing?.first_name || ''} ${data.billing?.last_name || ''}`.trim(),
        total: parseFloat(data.total),
        currency: data.currency,
        status: data.status,
        items: (data.line_items || []).map((i: any) => ({
          name: i.name,
          quantity: i.quantity,
          price: parseFloat(i.total),
        })),
        createdAt: data.date_created,
      };
    } catch {
      return null;
    }
  }

  async findOrdersByEmail(email: string): Promise<EcommerceOrder[]> {
    try {
      const response = await fetch(
        `${this.storeUrl}/wp-json/wc/v3/orders?search=${encodeURIComponent(email)}&per_page=10`,
        { headers: { 'Authorization': this.authHeader } }
      );
      if (!response.ok) return [];
      const data: any = await response.json();
      return data.map((d: any) => ({
        orderId: String(d.id),
        email: d.billing?.email || '',
        customerName: `${d.billing?.first_name || ''} ${d.billing?.last_name || ''}`.trim(),
        total: parseFloat(d.total),
        currency: d.currency,
        status: d.status,
        items: (d.line_items || []).map((i: any) => ({
          name: i.name,
          quantity: i.quantity,
          price: parseFloat(i.total),
        })),
        createdAt: d.date_created,
      }));
    } catch {
      return [];
    }
  }

  async getCustomer(email: string): Promise<EcommerceCustomer | null> {
    try {
      const response = await fetch(
        `${this.storeUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&per_page=1`,
        { headers: { 'Authorization': this.authHeader } }
      );
      if (!response.ok) return null;
      const data: any = await response.json();
      if (!data || data.length === 0) return null;
      const c = data[0];
      return {
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        ordersCount: c.orders_count,
        totalSpent: parseFloat(c.total_spent || '0'),
      };
    } catch {
      return null;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.storeUrl}/wp-json/wc/v3/system_status`, {
        headers: { 'Authorization': this.authHeader },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================
// BigCommerce
// ============================================================

export class BigCommerceProvider {
  private storeHash: string;
  private accessToken: string;
  private baseUrl: string;

  constructor(storeHash: string, accessToken: string) {
    this.storeHash = storeHash;
    this.accessToken = accessToken;
    this.baseUrl = `https://api.bigcommerce.com/stores/${storeHash}/v3`;
  }

  async getOrder(orderId: string): Promise<EcommerceOrder | null> {
    try {
      // BigCommerce orders are in v2
      const response = await fetch(
        `https://api.bigcommerce.com/stores/${this.storeHash}/v2/orders/${orderId}`,
        {
          headers: {
            'X-Auth-Token': this.accessToken,
            'Accept': 'application/json',
          },
        }
      );
      if (!response.ok) return null;
      const data: any = await response.json();
      return {
        orderId: String(data.id),
        email: data.billing_address?.email || '',
        customerName: `${data.billing_address?.first_name || ''} ${data.billing_address?.last_name || ''}`.trim(),
        total: parseFloat(data.total_inc_tax),
        currency: data.currency_code,
        status: data.status,
        items: [],
        createdAt: data.date_created,
      };
    } catch {
      return null;
    }
  }

  async findOrdersByEmail(email: string): Promise<EcommerceOrder[]> {
    try {
      const response = await fetch(
        `https://api.bigcommerce.com/stores/${this.storeHash}/v2/orders?email=${encodeURIComponent(email)}&limit=10`,
        {
          headers: {
            'X-Auth-Token': this.accessToken,
            'Accept': 'application/json',
          },
        }
      );
      if (!response.ok) return [];
      const data: any = await response.json();
      return (Array.isArray(data) ? data : []).map((d: any) => ({
        orderId: String(d.id),
        email: d.billing_address?.email || '',
        customerName: `${d.billing_address?.first_name || ''} ${d.billing_address?.last_name || ''}`.trim(),
        total: parseFloat(d.total_inc_tax),
        currency: d.currency_code,
        status: d.status,
        items: [],
        createdAt: d.date_created,
      }));
    } catch {
      return [];
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/catalog/summary`, {
        headers: {
          'X-Auth-Token': this.accessToken,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================
// Adobe Commerce (Magento)
// ============================================================

export class AdobeCommerceProvider {
  private baseUrl: string;
  private accessToken: string;

  constructor(storeUrl: string, accessToken: string) {
    this.baseUrl = storeUrl.replace(/\/$/, '') + '/rest/V1';
    this.accessToken = accessToken;
  }

  async getOrder(orderId: string): Promise<EcommerceOrder | null> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      });
      if (!response.ok) return null;
      const data: any = await response.json();
      return {
        orderId: String(data.entity_id),
        email: data.customer_email || '',
        customerName: `${data.customer_firstname || ''} ${data.customer_lastname || ''}`.trim(),
        total: data.grand_total,
        currency: data.order_currency_code,
        status: data.status,
        items: (data.items || []).map((i: any) => ({
          name: i.name,
          quantity: i.qty_ordered,
          price: i.row_total,
        })),
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  }

  async findOrdersByEmail(email: string): Promise<EcommerceOrder[]> {
    try {
      const searchCriteria = `searchCriteria[filterGroups][0][filters][0][field]=customer_email&searchCriteria[filterGroups][0][filters][0][value]=${encodeURIComponent(email)}&searchCriteria[pageSize]=10`;
      const response = await fetch(`${this.baseUrl}/orders?${searchCriteria}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      return (data.items || []).map((d: any) => ({
        orderId: String(d.entity_id),
        email: d.customer_email || '',
        customerName: `${d.customer_firstname || ''} ${d.customer_lastname || ''}`.trim(),
        total: d.grand_total,
        currency: d.order_currency_code,
        status: d.status,
        items: (d.items || []).map((i: any) => ({
          name: i.name,
          quantity: i.qty_ordered,
          price: i.row_total,
        })),
        createdAt: d.created_at,
      }));
    } catch {
      return [];
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/store/storeConfigs`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================
// PrestaShop
// ============================================================

export class PrestaShopProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(storeUrl: string, apiKey: string) {
    this.baseUrl = storeUrl.replace(/\/$/, '') + '/api';
    this.apiKey = apiKey;
  }

  private get authHeader() {
    return 'Basic ' + Buffer.from(`${this.apiKey}:`).toString('base64');
  }

  async getOrder(orderId: string): Promise<EcommerceOrder | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/orders/${orderId}?output_format=JSON`,
        { headers: { 'Authorization': this.authHeader } }
      );
      if (!response.ok) return null;
      const data: any = await response.json();
      const order = data.order;
      return {
        orderId: String(order.id),
        email: '',
        customerName: '',
        total: parseFloat(order.total_paid),
        currency: order.id_currency ? String(order.id_currency) : 'USD',
        status: order.current_state ? String(order.current_state) : 'unknown',
        items: (order.associations?.order_rows || []).map((i: any) => ({
          name: i.product_name,
          quantity: parseInt(i.product_quantity),
          price: parseFloat(i.unit_price_tax_incl),
        })),
        createdAt: order.date_add,
      };
    } catch {
      return null;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        headers: { 'Authorization': this.authHeader },
      });
      if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ============================================================
// WordPress (widget embed only — no e-commerce)
// ============================================================

export class WordPressProvider {
  /**
   * WordPress integration = just embed the chat widget via:
   * 1. WordPress plugin (forefront-chat plugin)
   * 2. Or manual script tag in theme header
   *
   * No API calls needed from backend — purely widget deployment.
   * Configuration is stored in the integrations table as metadata.
   */

  getWidgetSnippet(workspaceId: string, widgetDomain: string): string {
    return `<!-- Forefront Chat Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${widgetDomain}/loader.js';
    script.setAttribute('data-workspace', '${workspaceId}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  }

  getPluginInstructions(): string {
    return `
## WordPress Plugin Installation

1. Download the Forefront Chat plugin from Settings → Integrations → WordPress
2. In your WordPress admin, go to Plugins → Add New → Upload Plugin
3. Upload the ZIP file and activate the plugin
4. Go to Settings → Forefront Chat
5. Enter your Workspace ID and click Save

Alternatively, add the widget code manually to your theme's header.php or use a header/footer scripts plugin.
    `.trim();
  }
}

// ============================================================
// E-commerce Order Lookup Manager
// ============================================================

export class EcommerceManager {
  async lookupOrder(
    integrationType: string,
    credentials: Record<string, any>,
    orderId: string
  ): Promise<EcommerceOrder | null> {
    const provider = this.getProvider(integrationType, credentials);
    if (!provider || !('getOrder' in provider)) return null;
    return (provider as any).getOrder(orderId);
  }

  async findOrders(
    integrationType: string,
    credentials: Record<string, any>,
    email: string
  ): Promise<EcommerceOrder[]> {
    const provider = this.getProvider(integrationType, credentials);
    if (!provider || !('findOrdersByEmail' in provider)) return [];
    return (provider as any).findOrdersByEmail(email);
  }

  async testConnection(
    integrationType: string,
    credentials: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    const provider = this.getProvider(integrationType, credentials);
    if (!provider || !('testConnection' in provider)) {
      return { success: false, error: `Unknown e-commerce provider: ${integrationType}` };
    }
    return (provider as any).testConnection();
  }

  private getProvider(integrationType: string, credentials: Record<string, any>): any {
    switch (integrationType) {
      case 'woocommerce':
        return new WooCommerceProvider(credentials.storeUrl, credentials.consumerKey, credentials.consumerSecret);
      case 'bigcommerce':
        return new BigCommerceProvider(credentials.storeHash, credentials.accessToken);
      case 'adobe_commerce':
        return new AdobeCommerceProvider(credentials.storeUrl, credentials.accessToken);
      case 'prestashop':
        return new PrestaShopProvider(credentials.storeUrl, credentials.apiKey);
      case 'wordpress':
        return new WordPressProvider();
      default:
        return null;
    }
  }
}
