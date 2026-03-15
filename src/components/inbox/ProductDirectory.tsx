"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Search, ShoppingBag, Send, X, Loader2, Package,
  ChevronDown, ChevronUp, ExternalLink, ImageIcon, DollarSign, Check
} from 'lucide-react';

interface Product {
  id: string;
  shopify_id: string;
  title: string;
  handle: string;
  vendor?: string;
  product_type?: string;
  image_url?: string;
  price: string;
  compare_at_price?: string;
  currency?: string;
  inventory_quantity?: number;
  status: string;
  variants?: any[];
}

interface ProductDirectoryProps {
  open: boolean;
  onClose: () => void;
  onSendProduct: (product: Product) => void;
}

export function ProductDirectory({ open, onClose, onSendProduct }: ProductDirectoryProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  async function loadProducts() {
    setLoading(true);
    try {
      const stores = await apiFetch('/api/shopify/stores');
      if (stores?.data?.[0]) {
        const storeId = stores.data[0].id;
        const res = await apiFetch(`/api/shopify/products?storeId=${storeId}&limit=50`);
        setProducts(res?.data || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  const filtered = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.vendor?.toLowerCase().includes(q)) ||
      (p.product_type?.toLowerCase().includes(q))
    );
  });

  async function handleSend(product: Product) {
    setSending(product.id);
    onSendProduct(product);
    setTimeout(() => setSending(null), 800);
  }

  if (!open) return null;

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-[#f8fafc] w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ShoppingBag size={14} className="text-green-400" />
          <span className="text-sm text-gray-900 font-medium">Product Directory</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-500 hover:text-gray-900 hover:bg-white/5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-zinc-600 focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-zinc-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Package size={20} className="text-zinc-600" />
            <p className="text-xs text-zinc-500">
              {searchQuery ? 'No products match your search' : 'No products found'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                {/* Product image */}
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={16} className="text-zinc-600" />
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs text-gray-900 font-medium truncate">{product.title}</h4>
                  {product.vendor && (
                    <p className="text-[10px] text-zinc-500 truncate">{product.vendor}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-green-400 font-medium">
                      {product.currency || '$'}{product.price}
                    </span>
                    {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                      <span className="text-[10px] text-zinc-600 line-through">
                        {product.currency || '$'}{product.compare_at_price}
                      </span>
                    )}
                    {product.inventory_quantity !== undefined && product.inventory_quantity <= 3 && product.inventory_quantity > 0 && (
                      <span className="text-[10px] text-orange-400">
                        Only {product.inventory_quantity} left
                      </span>
                    )}
                    {product.inventory_quantity !== undefined && product.inventory_quantity === 0 && (
                      <span className="text-[10px] text-red-400">Out of stock</span>
                    )}
                  </div>
                </div>

                {/* Send button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleSend(product); }}
                  disabled={sending === product.id}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all flex-shrink-0",
                    sending === product.id
                      ? "bg-green-500/10 text-green-400"
                      : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                  )}
                  title="Send to chat"
                >
                  {sending === product.id ? <Check size={12} /> : <Send size={12} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200">
        <p className="text-[10px] text-zinc-600 text-center">
          Click the send icon to share a product in the chat
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   Product Card Message — renders inside the chat
   ────────────────────────────────────────────────── */

interface ProductCardMessageProps {
  product: {
    title: string;
    price: string;
    currency?: string;
    image_url?: string;
    handle?: string;
    vendor?: string;
  };
}

export function ProductCardMessage({ product }: ProductCardMessageProps) {
  return (
    <div className="bg-zinc-800/80 rounded-xl border border-gray-200 overflow-hidden max-w-[260px]">
      {/* Product image */}
      <div className="w-full h-32 bg-zinc-800 flex items-center justify-center">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <Package size={24} className="text-zinc-600" />
        )}
      </div>
      <div className="p-3">
        <h4 className="text-xs text-gray-900 font-medium line-clamp-2">{product.title}</h4>
        {product.vendor && <p className="text-[10px] text-zinc-500 mt-0.5">{product.vendor}</p>}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-green-400 font-semibold">{product.currency || '$'}{product.price}</span>
          <button className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300">
            <ExternalLink size={10} />
            View
          </button>
        </div>
      </div>
    </div>
  );
}
