import { pool } from '../../config/db.js';

export interface Product {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  price: number;
  compare_price: number | null;
  cost: number | null;
  category: string;
  sku: string;
  barcode: string | null;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  images: string[];
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
}

export interface Order {
  id: string;
  workspace_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillment_status: 'unfulfilled' | 'fulfilled' | 'shipped' | 'delivered';
  transaction_id: string;
  tracking_number: string | null;
  razorpay_order_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
}

export class StoreService {
  // ─── Products ────────────────────────────────────────────────────────────────

  async listProducts(
    workspaceId: string,
    filters?: { category?: string; status?: string; search?: string },
  ): Promise<Product[]> {
    let query = `SELECT * FROM store_products WHERE workspace_id = $1`;
    const params: any[] = [workspaceId];
    let idx = 2;

    if (filters?.category) { query += ` AND category = $${idx++}`; params.push(filters.category); }
    if (filters?.status)   { query += ` AND status = $${idx++}`;   params.push(filters.status); }
    if (filters?.search)   { query += ` AND name ILIKE $${idx++}`; params.push(`%${filters.search}%`); }

    query += ` ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  async createProduct(workspaceId: string, data: Partial<Product>): Promise<Product> {
    const { rows } = await pool.query(
      `INSERT INTO store_products
         (workspace_id, name, description, price, compare_price, cost, category, sku, barcode, stock, status, images, variants)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        workspaceId,
        data.name,
        data.description ?? '',
        data.price,
        data.compare_price ?? null,
        data.cost ?? null,
        data.category ?? 'Other',
        data.sku ?? '',
        data.barcode ?? null,
        data.stock ?? 0,
        data.status ?? 'draft',
        JSON.stringify(data.images ?? []),
        JSON.stringify(data.variants ?? []),
      ],
    );
    return rows[0];
  }

  async updateProduct(workspaceId: string, productId: string, data: Partial<Product>): Promise<Product> {
    const { rows } = await pool.query(
      `UPDATE store_products
       SET name        = COALESCE($1, name),
           price       = COALESCE($2, price),
           stock       = COALESCE($3, stock),
           status      = COALESCE($4, status),
           updated_at  = NOW()
       WHERE id = $5 AND workspace_id = $6
       RETURNING *`,
      [data.name, data.price, data.stock, data.status, productId, workspaceId],
    );
    return rows[0];
  }

  async deleteProduct(workspaceId: string, productId: string): Promise<void> {
    await pool.query(
      `DELETE FROM store_products WHERE id = $1 AND workspace_id = $2`,
      [productId, workspaceId],
    );
  }

  // ─── Orders ──────────────────────────────────────────────────────────────────

  async listOrders(workspaceId: string, paymentStatus?: string): Promise<Order[]> {
    const query = paymentStatus
      ? `SELECT * FROM store_orders WHERE workspace_id = $1 AND payment_status = $2 ORDER BY created_at DESC`
      : `SELECT * FROM store_orders WHERE workspace_id = $1 ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, paymentStatus ? [workspaceId, paymentStatus] : [workspaceId]);
    return rows;
  }

  async getOrder(workspaceId: string, orderId: string): Promise<Order | null> {
    const { rows } = await pool.query(
      `SELECT * FROM store_orders WHERE id = $1 AND workspace_id = $2`,
      [orderId, workspaceId],
    );
    return rows[0] ?? null;
  }

  async updateFulfillment(
    workspaceId: string,
    orderId: string,
    status: string,
    trackingNumber?: string,
  ): Promise<void> {
    await pool.query(
      `UPDATE store_orders
       SET fulfillment_status = $1,
           tracking_number    = $2,
           updated_at         = NOW()
       WHERE id = $3 AND workspace_id = $4`,
      [status, trackingNumber ?? null, orderId, workspaceId],
    );
  }

  // ─── Inventory ───────────────────────────────────────────────────────────────

  async adjustStock(
    workspaceId: string,
    productId: string,
    adjustment: number,
    reason: string,
  ): Promise<void> {
    await pool.query(
      `UPDATE store_products
       SET stock      = GREATEST(0, stock + $1),
           updated_at = NOW()
       WHERE id = $2 AND workspace_id = $3`,
      [adjustment, productId, workspaceId],
    );
    await pool.query(
      `INSERT INTO inventory_log (workspace_id, product_id, adjustment, reason)
       VALUES ($1, $2, $3, $4)`,
      [workspaceId, productId, adjustment, reason],
    );
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  async getStoreStats(workspaceId: string): Promise<{
    totalRevenue: number;
    orderCount: number;
    productCount: number;
    avgOrderValue: number;
  }> {
    const [revenueResult, productResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS order_count, COALESCE(SUM(total), 0) AS total_revenue
         FROM store_orders
         WHERE workspace_id = $1 AND payment_status = 'paid'`,
        [workspaceId],
      ),
      pool.query(
        `SELECT COUNT(*) AS product_count FROM store_products WHERE workspace_id = $1`,
        [workspaceId],
      ),
    ]);

    const orderCount   = parseInt(revenueResult.rows[0].order_count, 10);
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue);

    return {
      totalRevenue,
      orderCount,
      productCount: parseInt(productResult.rows[0].product_count, 10),
      avgOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
    };
  }
}
