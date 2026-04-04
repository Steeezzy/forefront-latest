/**
 * Invoice Service — CRUD, GST calculation, SMS sending, revenue summary.
 *
 * @route All routes registered at /api/invoices
 */

import { pool } from '../../config/db.js';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface CreateInvoiceInput {
  workspaceId: string;
  customerId?: string;
  items: InvoiceItem[];
  notes?: string;
  dueDate?: string;
  taxRate?: number;
}

export class InvoiceService {

  async createInvoice(input: CreateInvoiceInput) {
    const { workspaceId, customerId, items, notes, dueDate, taxRate = 18 } = input;

    // Generate invoice number
    const seqResult = await pool.query(`SELECT nextval('invoice_number_seq') AS num`);
    const invoiceNumber = `INV-${seqResult.rows[0].num}`;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));

    // Insert invoice
    const invoiceResult = await pool.query(
      `INSERT INTO invoices (workspace_id, customer_id, invoice_number, subtotal, tax_rate, tax_amount, total, notes, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [workspaceId, customerId || null, invoiceNumber, subtotal, taxRate, taxAmount, total, notes || null, dueDate || null]
    );

    const invoice = invoiceResult.rows[0];

    // Insert line items
    for (const item of items) {
      const itemTotal = Number((item.quantity * item.unit_price).toFixed(2));
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoice.id, item.description, item.quantity, item.unit_price, itemTotal]
      );
    }

    return invoice;
  }

  async getInvoices(workspaceId: string, status?: string) {
    const conditions = ['i.workspace_id = $1'];
    const values: any[] = [workspaceId];

    if (status && status !== 'all') {
      conditions.push(`i.status = $${values.length + 1}`);
      values.push(status);
    }

    const result = await pool.query(
      `SELECT i.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
       FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY i.created_at DESC`,
      values
    );

    return result.rows;
  }

  async getInvoiceById(invoiceId: string) {
    const [invoice, items] = await Promise.all([
      pool.query(
        `SELECT i.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
         FROM invoices i
         LEFT JOIN customers c ON c.id = i.customer_id
         WHERE i.id = $1`,
        [invoiceId]
      ),
      pool.query(
        `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at`,
        [invoiceId]
      ),
    ]);

    if (invoice.rows.length === 0) return null;

    return {
      ...invoice.rows[0],
      items: items.rows,
    };
  }

  async updateStatus(invoiceId: string, status: string) {
    const updates: string[] = ['status = $2', 'updated_at = NOW()'];
    const values: any[] = [invoiceId, status];

    if (status === 'sent') {
      updates.push(`sent_at = NOW()`);
    } else if (status === 'paid') {
      updates.push(`paid_at = NOW()`);
    }

    const result = await pool.query(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async markAsPaid(invoiceId: string) {
    return this.updateStatus(invoiceId, 'paid');
  }

  async getRevenueSummary(workspaceId: string) {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total_invoices,
         COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
         COUNT(*) FILTER (WHERE status = 'sent')::int AS pending_count,
         COUNT(*) FILTER (WHERE status = 'overdue')::int AS overdue_count,
         COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0)::numeric AS total_revenue,
         COALESCE(SUM(total) FILTER (WHERE status IN ('sent', 'overdue')), 0)::numeric AS outstanding,
         COALESCE(SUM(total), 0)::numeric AS total_invoiced,
         COALESCE(SUM(tax_amount) FILTER (WHERE status = 'paid'), 0)::numeric AS total_tax_collected
       FROM invoices
       WHERE workspace_id = $1`,
      [workspaceId]
    );

    return result.rows[0];
  }

  async checkOverdue() {
    const result = await pool.query(
      `UPDATE invoices
       SET status = 'overdue', updated_at = NOW()
       WHERE status = 'sent'
         AND due_date IS NOT NULL
         AND due_date < CURRENT_DATE
       RETURNING id, workspace_id, invoice_number`
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log(`[InvoiceService] Marked ${result.rowCount} invoices as overdue`);
    }

    return result.rows;
  }
}

export const invoiceService = new InvoiceService();
