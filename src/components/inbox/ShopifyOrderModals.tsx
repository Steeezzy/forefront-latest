"use client";

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  X, XCircle, Loader2, Check, AlertTriangle, RotateCcw,
  DollarSign, Package, Bell, ChevronDown
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   CANCEL ORDER MODAL
   ══════════════════════════════════════════════════════════ */

interface CancelOrderModalProps {
  open: boolean;
  order: {
    id: string;
    shopify_id: string;
    order_number: string;
    total_price: string;
    currency: string;
    line_items?: any[];
  };
  storeId: string;
  onClose: () => void;
  onCancelled?: () => void;
}

const CANCEL_REASONS = [
  { value: 'customer', label: 'Customer changed/cancelled order' },
  { value: 'fraud', label: 'Fraudulent order' },
  { value: 'inventory', label: 'Items unavailable' },
  { value: 'declined', label: 'Payment declined' },
  { value: 'other', label: 'Other' },
];

export function ShopifyCancelOrderModal({
  open,
  order,
  storeId,
  onClose,
  onCancelled,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('customer');
  const [refund, setRefund] = useState(true);
  const [restock, setRestock] = useState(true);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  async function handleCancel() {
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/shopify/orders/${order.shopify_id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({
          store_id: storeId,
          reason,
          refund,
          restock,
          notify_customer: notifyCustomer,
        }),
      });
      setSuccess(true);
      onCancelled?.();
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to cancel order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XCircle size={18} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold text-sm">Cancel Order #{order.order_number}</h2>
              <p className="text-zinc-500 text-[11px]">{order.currency}{order.total_price}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-gray-900 hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check size={24} className="text-green-400" />
            </div>
            <p className="text-green-400 font-medium text-sm">Order cancelled successfully</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/5 border border-red-500/20 rounded-lg">
                <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">
                  This action cannot be undone. The order will be marked as cancelled in Shopify.
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Cancellation Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-red-500 appearance-none"
                >
                  {CANCEL_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Toggle options */}
              <div className="space-y-3">
                <ToggleRow
                  icon={DollarSign}
                  label="Issue refund"
                  description={`Refund ${order.currency}${order.total_price} to customer`}
                  checked={refund}
                  onChange={setRefund}
                />
                <ToggleRow
                  icon={Package}
                  label="Restock items"
                  description="Return items to inventory"
                  checked={restock}
                  onChange={setRestock}
                />
                <ToggleRow
                  icon={Bell}
                  label="Notify customer"
                  description="Send cancellation email to the customer"
                  checked={notifyCustomer}
                  onChange={setNotifyCustomer}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle size={12} className="text-red-400" />
                  <span className="text-xs text-red-400">{error}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <Button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs h-8 px-4">
                Keep Order
              </Button>
              <Button
                onClick={handleCancel}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-500 text-gray-900 text-xs h-8 px-4"
              >
                {submitting ? <Loader2 size={13} className="animate-spin mr-1" /> : <XCircle size={13} className="mr-1" />}
                Cancel Order
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REFUND ORDER MODAL
   ══════════════════════════════════════════════════════════ */

interface RefundOrderModalProps {
  open: boolean;
  order: {
    id: string;
    shopify_id: string;
    order_number: string;
    total_price: string;
    currency: string;
    line_items?: any[];
  };
  storeId: string;
  onClose: () => void;
  onRefunded?: () => void;
}

export function ShopifyRefundModal({
  open,
  order,
  storeId,
  onClose,
  onRefunded,
}: RefundOrderModalProps) {
  const [refundAmount, setRefundAmount] = useState(order.total_price);
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [reason, setReason] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [restock, setRestock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  async function handleRefund() {
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid refund amount');
      return;
    }
    if (amount > parseFloat(order.total_price)) {
      setError('Refund cannot exceed order total');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/shopify/orders/${order.shopify_id}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          store_id: storeId,
          amount: amount.toFixed(2),
          currency: order.currency,
          reason,
          notify_customer: notifyCustomer,
          restock,
        }),
      });
      setSuccess(true);
      onRefunded?.();
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to issue refund');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <RotateCcw size={18} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold text-sm">Refund Order #{order.order_number}</h2>
              <p className="text-zinc-500 text-[11px]">Total: {order.currency}{order.total_price}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-gray-900 hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check size={24} className="text-green-400" />
            </div>
            <p className="text-green-400 font-medium text-sm">Refund issued successfully</p>
            <p className="text-zinc-500 text-xs">{order.currency}{refundAmount} refunded</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 space-y-4">
              {/* Line items summary */}
              {order.line_items && order.line_items.length > 0 && (
                <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Order Items</span>
                  {order.line_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-zinc-300 truncate max-w-[200px]">
                        {item.title || item.name} × {item.quantity}
                      </span>
                      <span className="text-xs text-zinc-400">{order.currency}{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Refund type */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsFullRefund(true); setRefundAmount(order.total_price); }}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                    isFullRefund
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                      : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700"
                  )}
                >
                  Full Refund
                </button>
                <button
                  onClick={() => setIsFullRefund(false)}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border",
                    !isFullRefund
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                      : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700"
                  )}
                >
                  Partial Refund
                </button>
              </div>

              {/* Refund amount */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Refund Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                    {order.currency || '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    disabled={isFullRefund}
                    className={cn(
                      "w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-yellow-500",
                      isFullRefund && "opacity-50"
                    )}
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for refund..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-zinc-600 focus:outline-none focus:border-yellow-500"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <ToggleRow
                  icon={Package}
                  label="Restock items"
                  description="Return items to inventory"
                  checked={restock}
                  onChange={setRestock}
                />
                <ToggleRow
                  icon={Bell}
                  label="Notify customer"
                  description="Send refund confirmation email"
                  checked={notifyCustomer}
                  onChange={setNotifyCustomer}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle size={12} className="text-red-400" />
                  <span className="text-xs text-red-400">{error}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <Button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs h-8 px-4">
                Cancel
              </Button>
              <Button
                onClick={handleRefund}
                disabled={submitting}
                className="bg-yellow-600 hover:bg-yellow-500 text-gray-900 text-xs h-8 px-4"
              >
                {submitting ? <Loader2 size={13} className="animate-spin mr-1" /> : <RotateCcw size={13} className="mr-1" />}
                Submit Refund
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SHARED TOGGLE ROW
   ══════════════════════════════════════════════════════════ */

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: any;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon size={13} className="text-zinc-500" />
        <div>
          <span className="text-xs text-zinc-300 block">{label}</span>
          <span className="text-[10px] text-zinc-600">{description}</span>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "w-8 h-[18px] rounded-full transition-colors relative",
          checked ? "bg-blue-600" : "bg-zinc-700"
        )}
      >
        <div
          className={cn(
            "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform",
            checked ? "translate-x-[16px]" : "translate-x-[2px]"
          )}
        />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHANGE ADDRESS MODAL
   ══════════════════════════════════════════════════════════ */

interface ChangeAddressModalProps {
  open: boolean;
  order: {
    id: string;
    shopify_id: string;
    order_number: string;
    shipping_address?: {
      address1: string;
      address2: string;
      city: string;
      province: string;
      zip: string;
      country: string;
    };
  };
  storeId: string;
  onClose: () => void;
  onAddressUpdated?: () => void;
}

export function ShopifyChangeAddressModal({
  open,
  order,
  storeId,
  onClose,
  onAddressUpdated,
}: ChangeAddressModalProps) {
  const [address1, setAddress1] = useState(order.shipping_address?.address1 || '');
  const [address2, setAddress2] = useState(order.shipping_address?.address2 || '');
  const [city, setCity] = useState(order.shipping_address?.city || '');
  const [province, setProvince] = useState(order.shipping_address?.province || '');
  const [zip, setZip] = useState(order.shipping_address?.zip || '');
  const [country, setCountry] = useState(order.shipping_address?.country || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  async function handleUpdate() {
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/shopify/orders/${order.shopify_id}/address`, {
        method: 'POST',
        body: JSON.stringify({
          store_id: storeId,
          address: { address1, address2, city, province, zip, country }
        }),
      });
      setSuccess(true);
      onAddressUpdated?.();
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to update address');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Package size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold text-sm">Update Address #{order.order_number}</h2>
              <p className="text-zinc-500 text-[11px]">Shipping Destination</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-gray-900 hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check size={24} className="text-green-400" />
            </div>
            <p className="text-green-400 font-medium text-sm">Address updated successfully</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Address Line 1</label>
                <input type="text" value={address1} onChange={e => setAddress1(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Address Line 2 (Optional)</label>
                <input type="text" value={address2} onChange={e => setAddress2(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">State/Province</label>
                  <input type="text" value={province} onChange={e => setProvince(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Postal/Zip Code</label>
                  <input type="text" value={zip} onChange={e => setZip(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Country</label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle size={12} className="text-red-400" />
                  <span className="text-xs text-red-400">{error}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <Button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs h-8 px-4">
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={submitting} className="bg-blue-600 hover:bg-blue-500 text-gray-900 text-xs h-8 px-4">
                {submitting && <Loader2 size={13} className="animate-spin mr-1" />}
                Update Address
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
