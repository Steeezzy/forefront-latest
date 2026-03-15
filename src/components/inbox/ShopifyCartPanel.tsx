"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  ShoppingCart, Package, RefreshCw, ChevronDown, ChevronUp,
  DollarSign, AlertCircle, Clock
} from 'lucide-react';

interface CartItem {
  product_title: string;
  variant_title?: string;
  quantity: number;
  price: string;
  image_url?: string;
}

interface CartData {
  items: CartItem[];
  total_price: string;
  currency: string;
  created_at: string;
  updated_at: string;
  item_count: number;
}

interface ShopifyCartPanelProps {
  conversationId: string;
  visitorEmail?: string;
}

export function ShopifyCartPanel({ conversationId, visitorEmail }: ShopifyCartPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartData | null>(null);

  useEffect(() => {
    loadCart();
  }, [conversationId]);

  async function loadCart() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/shopify/cart/${conversationId}`);
      if (res?.data && res.data.items?.length > 0) {
        setCart(res.data);
      }
    } catch {
      // Cart data unavailable — not an error
    } finally {
      setLoading(false);
    }
  }

  // Don't render if no cart data
  if (!loading && !cart) return null;
  if (loading) return null; // Don't show skeleton for cart

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <ShoppingCart size={13} className="text-green-400" />
          Cart
          {cart && (
            <span className="text-[10px] text-green-400 normal-case font-normal ml-1">
              {cart.item_count} item{cart.item_count !== 1 ? 's' : ''}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && cart && (
        <div className="px-4 pb-3 space-y-2">
          {cart.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 py-1.5">
              <div className="w-8 h-8 rounded bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_title} className="w-full h-full object-cover" />
                ) : (
                  <Package size={12} className="text-zinc-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-zinc-300 truncate">{item.product_title}</p>
                {item.variant_title && item.variant_title !== 'Default Title' && (
                  <p className="text-[10px] text-zinc-600 truncate">{item.variant_title}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[11px] text-zinc-300">{cart.currency}{item.price}</span>
                <p className="text-[10px] text-zinc-600">× {item.quantity}</p>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-[11px] text-zinc-500">Cart total</span>
            <span className="text-xs text-gray-900 font-medium">{cart.currency}{cart.total_price}</span>
          </div>

          {/* Last updated */}
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="text-zinc-600" />
            <span className="text-[10px] text-zinc-600">
              Updated {new Date(cart.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={loadCart}
              className="ml-auto p-0.5 text-zinc-600 hover:text-zinc-400 transition-colors"
              title="Refresh cart"
            >
              <RefreshCw size={10} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
