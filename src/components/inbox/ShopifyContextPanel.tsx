"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
  ShoppingCart, Package, DollarSign, RefreshCw, ExternalLink,
  ChevronDown, ChevronUp, AlertCircle, Truck, CreditCard,
  Clock, User, MapPin, XCircle, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShopifyCancelOrderModal, ShopifyRefundModal, ShopifyChangeAddressModal } from './ShopifyOrderModals';
import { CreateTicketDialog } from './CreateTicketDialog';

interface ShopifyOrder {
  id: string;
  shopify_id: string;
  order_number: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  currency: string;
  created_at: string;
  line_items?: any[];
}

interface ShopifyCustomer {
  id: string;
  shopify_id: string;
  email: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  total_spent: string;
  currency: string;
  tags?: string;
  created_at: string;
  default_address?: any;
}

interface FormattedContext {
  customer: ShopifyCustomer;
  orders: ShopifyOrder[];
  summary: string;
}

interface ShopifyContextPanelProps {
  conversationId: string;
  visitorEmail?: string;
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  refunded: 'bg-red-500/10 text-red-400',
  partially_refunded: 'bg-orange-500/10 text-orange-400',
  voided: 'bg-zinc-500/10 text-zinc-400',
  authorized: 'bg-blue-500/10 text-blue-400',
};

const FULFILLMENT_COLORS: Record<string, string> = {
  fulfilled: 'bg-green-500/10 text-green-400',
  partial: 'bg-yellow-500/10 text-yellow-400',
  unfulfilled: 'bg-zinc-500/10 text-zinc-400',
};

export function ShopifyContextPanel({ conversationId, visitorEmail }: ShopifyContextPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<FormattedContext | null>(null);
  const [storeConnected, setStoreConnected] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelOrder, setCancelOrder] = useState<ShopifyOrder | null>(null);
  const [refundOrder, setRefundOrder] = useState<ShopifyOrder | null>(null);
  const [changeAddressOrder, setChangeAddressOrder] = useState<ShopifyOrder | null>(null);
  const [createTicketOrder, setCreateTicketOrder] = useState<ShopifyOrder | null>(null);
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    loadShopifyData();
  }, [conversationId, visitorEmail]);

  async function loadShopifyData() {
    setLoading(true);
    setError(null);
    try {
      // Check if Shopify store is connected
      const stores = await apiFetch('/api/shopify/stores');
      if (!stores?.data?.length) {
        setStoreConnected(false);
        setLoading(false);
        return;
      }
      setStoreConnected(true);
      setStoreId(stores.data[0].id);

      // Get customer context via conversation ID
      const resp = await apiFetch(`/api/shopify/context/conversation/${conversationId}`);
      if (resp?.data) {
        setContext(resp.data);
      } else if (visitorEmail) {
        // Fallback: search customer by email
        const storeId = stores.data[0].id;
        const custResp = await apiFetch(`/api/shopify/customers/search?storeId=${storeId}&q=${encodeURIComponent(visitorEmail)}`);
        if (custResp?.data?.[0]) {
          const customer = custResp.data[0];
          // Fetch their orders
          const orderResp = await apiFetch(`/api/shopify/orders?storeId=${storeId}&customerId=${customer.shopify_id}&limit=5`);
          setContext({
            customer,
            orders: orderResp?.data || [],
            summary: `${customer.first_name} ${customer.last_name} — ${customer.orders_count} orders, ${customer.currency || '$'}${customer.total_spent} total`,
          });
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Don't render if Shopify is not connected
  if (!loading && !storeConnected) return null;

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <ShoppingCart size={13} />
          Shopify
          {context && <span className="text-[10px] text-green-400 normal-case font-normal ml-1">Connected</span>}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <RefreshCw size={12} className="animate-spin text-zinc-500" />
              <span className="text-xs text-zinc-500">Loading Shopify data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 py-2">
              <AlertCircle size={12} className="text-red-400" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          ) : !context ? (
            <p className="text-xs text-zinc-500 py-1">
              No Shopify customer found for this visitor.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Customer Summary */}
              <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <User size={13} className="text-zinc-400" />
                  <span className="text-xs text-gray-900 font-medium">
                    {context.customer.first_name} {context.customer.last_name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Package size={11} className="text-zinc-500" />
                    <span className="text-[11px] text-zinc-400">
                      {context.customer.orders_count} orders
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={11} className="text-zinc-500" />
                    <span className="text-[11px] text-zinc-400">
                      {context.customer.currency || '$'}{context.customer.total_spent}
                    </span>
                  </div>
                </div>
                {context.customer.tags && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {context.customer.tags.split(',').filter(Boolean).slice(0, 5).map((tag, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px]">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              {context.orders.length > 0 && (
                <div>
                  <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    Recent Orders
                  </span>
                  <div className="mt-2 space-y-2">
                    {context.orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="bg-zinc-800/30 rounded-lg p-2.5 cursor-pointer hover:bg-zinc-800/60 transition-colors"
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-900 font-medium">
                              #{order.order_number}
                            </span>
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-medium',
                              STATUS_COLORS[order.financial_status] || STATUS_COLORS.pending
                            )}>
                              {order.financial_status}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400">
                            {order.currency || '$'}{order.total_price}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1.5">
                            {order.fulfillment_status ? (
                              <span className={cn(
                                'px-1.5 py-0.5 rounded text-[10px]',
                                FULFILLMENT_COLORS[order.fulfillment_status] || FULFILLMENT_COLORS.unfulfilled
                              )}>
                                <Truck size={9} className="inline mr-0.5" />
                                {order.fulfillment_status}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-500/10 text-zinc-400">
                                <Truck size={9} className="inline mr-0.5" />
                                unfulfilled
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Expanded order details */}
                        {selectedOrder === order.id && order.line_items && (
                          <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                            {order.line_items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-[11px] text-zinc-300 truncate max-w-[160px]">
                                  {item.title || item.name} × {item.quantity}
                                </span>
                                <span className="text-[11px] text-zinc-400">
                                  ${item.price}
                                </span>
                              </div>
                            ))}

                            {/* Action Buttons — Cancel & Refund */}
                            <div className="flex gap-1.5 pt-2 border-t border-gray-200 mt-2">
                              {(order.fulfillment_status === null || order.fulfillment_status === 'unfulfilled') && order.financial_status !== 'refunded' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setCancelOrder(order); }}
                                  className="flex items-center gap-1 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] transition-colors"
                                >
                                  <XCircle size={10} />
                                  Cancel
                                </button>
                              )}
                              {order.financial_status === 'paid' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setRefundOrder(order); }}
                                  className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded text-[10px] transition-colors"
                                >
                                  <RotateCcw size={10} />
                                  Refund
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setChangeAddressOrder(order); }}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-[10px] transition-colors"
                              >
                                <MapPin size={10} />
                                Address
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setCreateTicketOrder(order); }}
                                className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded text-[10px] transition-colors"
                              >
                                Ticket
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={loadShopifyData}
                  className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[11px] text-zinc-400 transition-colors"
                >
                  <RefreshCw size={10} />
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelOrder && (
        <ShopifyCancelOrderModal
          open={!!cancelOrder}
          order={cancelOrder}
          storeId={storeId}
          onClose={() => setCancelOrder(null)}
          onCancelled={() => { setCancelOrder(null); loadShopifyData(); }}
        />
      )}

      {/* Refund Modal */}
      {refundOrder && (
        <ShopifyRefundModal
          open={!!refundOrder}
          order={refundOrder}
          storeId={storeId}
          onClose={() => setRefundOrder(null)}
          onRefunded={() => { setRefundOrder(null); loadShopifyData(); }}
        />
      )}

      {/* Change Address Modal */}
      {changeAddressOrder && (
        <ShopifyChangeAddressModal
          open={!!changeAddressOrder}
          order={changeAddressOrder}
          storeId={storeId}
          onClose={() => setChangeAddressOrder(null)}
          onAddressUpdated={() => { setChangeAddressOrder(null); loadShopifyData(); }}
        />
      )}

      {/* Create Ticket Modal */}
      {createTicketOrder && (
        <CreateTicketDialog
          open={!!createTicketOrder}
          onClose={() => setCreateTicketOrder(null)}
          initialSubject={`Shopify Order #${createTicketOrder.order_number} Issue`}
          initialDescription={`Order Context:\n- Order ID: #${createTicketOrder.order_number}\n- Status: ${createTicketOrder.financial_status} / ${createTicketOrder.fulfillment_status || 'unfulfilled'}\n- Total: ${createTicketOrder.currency || '$'}${createTicketOrder.total_price}\n\n[Add details here]`}
        />
      )}
    </div>
  );
}
