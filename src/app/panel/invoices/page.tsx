"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Receipt, Plus, Send, Check, Clock,
  AlertTriangle, DollarSign, X, FileText
} from "lucide-react";

type Invoice = {
  id: string;
  invoice_number: string;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  due_date?: string;
  created_at: string;
  paid_at?: string;
};

type RevenueSummary = {
  total_invoices: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  total_revenue: number;
  outstanding: number;
  total_invoiced: number;
  total_tax_collected: number;
};

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  draft: { icon: FileText, color: "text-gray-500", bg: "bg-gray-100" },
  sent: { icon: Send, color: "text-blue-600", bg: "bg-blue-50" },
  paid: { icon: Check, color: "text-emerald-600", bg: "bg-emerald-50" },
  overdue: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  cancelled: { icon: X, color: "text-gray-400", bg: "bg-gray-50" },
};

function formatINR(v: number) {
  return `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [items, setItems] = useState([{ description: "", quantity: 1, unit_price: 0 }]);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");

  const workspaceId = typeof window !== "undefined" ? localStorage.getItem("workspaceId") || "" : "";

  const fetchData = useCallback(async () => {
    try {
      const [invRes, sumRes] = await Promise.all([
        fetch(`/api/invoices?workspaceId=${workspaceId}&status=${statusFilter}`, { credentials: "include" }),
        fetch(`/api/invoices/summary?workspaceId=${workspaceId}`, { credentials: "include" }),
      ]);
      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(data.invoices || []);
      }
      if (sumRes.ok) {
        setSummary(await sumRes.json());
      }
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, [workspaceId, statusFilter]);

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId, fetchData]);

  const handleCreate = async () => {
    if (!items.some((i) => i.description && i.unit_price > 0)) return;
    setCreating(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workspaceId,
          items: items.filter((i) => i.description),
          notes,
          dueDate: dueDate || undefined,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setItems([{ description: "", quantity: 1, unit_price: 0 }]);
        setNotes("");
        setDueDate("");
        fetchData();
      }
    } catch { /* */ } finally {
      setCreating(false);
    }
  };

  const handleAction = async (invoiceId: string, action: string) => {
    try {
      await fetch(`/api/invoices/${invoiceId}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      fetchData();
    } catch { /* */ }
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxAmount = subtotal * 0.18;
  const total = subtotal + taxAmount;

  return (
    <div className="p-6 bg-[#f4f4f5] min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">Create and manage invoices for your customers</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 flex items-center gap-2"
        >
          <Plus size={16} />
          New Invoice
        </button>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Revenue", value: formatINR(summary.total_revenue), icon: DollarSign, color: "text-emerald-600" },
            { label: "Outstanding", value: formatINR(summary.outstanding), icon: Clock, color: "text-amber-600" },
            { label: "Paid", value: summary.paid_count, icon: Check, color: "text-emerald-600" },
            { label: "Overdue", value: summary.overdue_count, icon: AlertTriangle, color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={14} className={s.color} />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 mb-4">
        {["all", "draft", "sent", "paid", "overdue"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs rounded-lg capitalize transition-colors ${
              statusFilter === s ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Invoice</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Receipt className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No invoices yet</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-gray-900 font-medium">{inv.invoice_number}</td>
                      <td className="py-3 px-4 text-gray-700">{inv.customer_name || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon size={10} />
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{formatINR(inv.total)}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {inv.status === "draft" && (
                            <button onClick={() => handleAction(inv.id, "send")}
                              className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                              Send
                            </button>
                          )}
                          {(inv.status === "sent" || inv.status === "overdue") && (
                            <button onClick={() => handleAction(inv.id, "pay")}
                              className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100">
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">New Invoice</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Line items */}
            <div className="space-y-3 mb-4">
              <label className="text-xs font-medium text-gray-500">Line Items</label>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].description = e.target.value;
                      setItems(newItems);
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].quantity = Number(e.target.value);
                      setItems(newItems);
                    }}
                    className="w-16 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.unit_price || ""}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].unit_price = Number(e.target.value);
                      setItems(newItems);
                    }}
                    className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
              ))}
              <button
                onClick={() => setItems([...items, { description: "", quantity: 1, unit_price: 0 }])}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                + Add item
              </button>
            </div>

            {/* Due date + Notes */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-6">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GST (18%)</span><span>{formatINR(taxAmount)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                <span>Total</span><span>{formatINR(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
