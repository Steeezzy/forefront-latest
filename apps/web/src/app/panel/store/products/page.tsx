'use client';

import { useState } from 'react';
import {
  Plus, Search, Grid3X3, List, Edit2, Trash2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Product = {
  id: string;
  name: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  status: 'active' | 'draft';
  category: string;
  sku: string;
  description?: string;
  cost?: number;
  barcode?: string;
};

const mockProducts: Product[] = [
  { id: '1', name: 'Ayurvedic Hair Oil', price: 449, comparePrice: 599, stock: 234, status: 'active', category: 'Health', sku: 'AHO-001' },
  { id: '2', name: 'Cotton Kurta Set', price: 1299, comparePrice: null, stock: 45, status: 'active', category: 'Clothing', sku: 'CKS-023' },
  { id: '3', name: 'Steel Water Bottle', price: 399, comparePrice: 499, stock: 5, status: 'active', category: 'Home', sku: 'SWB-007' },
  { id: '4', name: 'Organic Turmeric', price: 199, comparePrice: null, stock: 0, status: 'active', category: 'Food', sku: 'OTM-012' },
  { id: '5', name: 'Bamboo Toothbrush', price: 149, comparePrice: 199, stock: 120, status: 'draft', category: 'Health', sku: 'BTB-004' },
  { id: '6', name: 'Printed Tote Bag', price: 299, comparePrice: null, stock: 78, status: 'active', category: 'Clothing', sku: 'PTB-019' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: 'from-blue-400 to-indigo-500',
  Clothing: 'from-pink-400 to-rose-500',
  Food: 'from-green-400 to-emerald-500',
  Health: 'from-teal-400 to-cyan-500',
  Home: 'from-amber-400 to-orange-500',
  Other: 'from-gray-400 to-gray-500',
};

const CATEGORIES = ['Electronics', 'Clothing', 'Food', 'Health', 'Home', 'Other'];

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN')}`;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">Out of Stock</span>;
  if (stock <= 10) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">Low Stock ({stock})</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">In Stock ({stock})</span>;
}

type AddProductForm = {
  name: string;
  description: string;
  price: string;
  comparePrice: string;
  cost: string;
  category: string;
  stock: string;
  sku: string;
  barcode: string;
  status: boolean;
  variants: { type: string; options: string }[];
};

const emptyForm: AddProductForm = {
  name: '',
  description: '',
  price: '',
  comparePrice: '',
  cost: '',
  category: 'Other',
  stock: '',
  sku: '',
  barcode: '',
  status: true,
  variants: [],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<AddProductForm>(emptyForm);

  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSave() {
    const newProduct: Product = {
      id: String(Date.now()),
      name: form.name || 'Untitled Product',
      price: parseFloat(form.price) || 0,
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      stock: parseInt(form.stock) || 0,
      status: form.status ? 'active' : 'draft',
      category: form.category,
      sku: form.sku,
    };
    setProducts((prev) => [newProduct, ...prev]);
    setForm(emptyForm);
    setShowDialog(false);
  }

  function addVariant() {
    setForm((f) => ({ ...f, variants: [...f.variants, { type: 'Size', options: 'S, M, L, XL' }] }));
  }

  function removeVariant(idx: number) {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} products total</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-gray-200"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36 rounded-xl border-gray-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 rounded-xl border-gray-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={cn('rounded-xl h-9 w-9', viewMode === 'grid' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={cn('rounded-xl h-9 w-9', viewMode === 'list' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Product grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onDelete={handleDelete} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
              No products found
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-3.5 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3.5 font-mono text-gray-500 text-xs">{p.sku}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{p.category}</span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900">
                    {formatINR(p.price)}
                    {p.comparePrice && (
                      <span className="text-gray-400 line-through text-xs ml-1">{formatINR(p.comparePrice)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5"><StockBadge stock={p.stock} /></td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', p.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-red-500 hover:text-red-600" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Basic info */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Product Name</Label>
                <Input placeholder="e.g. Ayurvedic Hair Oil" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl border-gray-200" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description</Label>
                <Textarea placeholder="Describe your product…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="rounded-xl border-gray-200 min-h-20 resize-none" />
              </div>
            </div>

            {/* Pricing */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pricing</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Price (₹)', key: 'price' as const, placeholder: '449' },
                  { label: 'Compare at (₹)', key: 'comparePrice' as const, placeholder: '599' },
                  { label: 'Cost (₹)', key: 'cost' as const, placeholder: '200' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</Label>
                    <Input type="number" placeholder={placeholder} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="rounded-xl border-gray-200" />
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger className="rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Stock Quantity</Label>
                  <Input type="number" placeholder="100" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="rounded-xl border-gray-200" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">SKU</Label>
                  <Input placeholder="AHO-001" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="rounded-xl border-gray-200" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Barcode</Label>
                  <Input placeholder="8901234567890" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} className="rounded-xl border-gray-200" />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Active</p>
                <p className="text-xs text-gray-400">Publish product to your store</p>
              </div>
              <Switch checked={form.status} onCheckedChange={(v) => setForm((f) => ({ ...f, status: v }))} />
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Variants</p>
                <Button variant="outline" size="sm" onClick={addVariant} className="rounded-xl text-xs h-7 border-gray-200">
                  <Plus className="h-3 w-3 mr-1" /> Add Variant
                </Button>
              </div>
              {form.variants.map((variant, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <Select value={variant.type} onValueChange={(v) => setForm((f) => ({ ...f, variants: f.variants.map((vv, i) => i === idx ? { ...vv, type: v } : vv) }))}>
                    <SelectTrigger className="w-28 rounded-xl border-gray-200 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Size">Size</SelectItem>
                      <SelectItem value="Color">Color</SelectItem>
                      <SelectItem value="Material">Material</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="S, M, L, XL"
                    value={variant.options}
                    onChange={(e) => setForm((f) => ({ ...f, variants: f.variants.map((vv, i) => i === idx ? { ...vv, options: e.target.value } : vv) }))}
                    className="flex-1 rounded-xl border-gray-200 h-9 text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-gray-400" onClick={() => removeVariant(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {form.variants.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">No variants added</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl border-gray-200">Cancel</Button>
              <Button onClick={handleSave} className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl">Save Product</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductCard({ product, onDelete }: { product: Product; onDelete: (id: string) => void }) {
  const gradientClass = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Other;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      {/* Image placeholder */}
      <div className={cn('h-40 bg-gradient-to-br flex items-center justify-center', gradientClass)}>
        <span className="text-white/80 text-4xl font-bold select-none">{product.name.charAt(0)}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Name + status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight">{product.name}</h3>
          <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium capitalize flex-shrink-0', product.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
            {product.status}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">{formatINR(product.price)}</span>
          {product.comparePrice && (
            <span className="text-sm text-gray-400 line-through">{formatINR(product.comparePrice)}</span>
          )}
        </div>

        {/* Category + Stock */}
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{product.category}</span>
          <StockBadge stock={product.stock} />
        </div>

        {/* SKU */}
        <p className="text-xs text-gray-400 font-mono">SKU: {product.sku}</p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 rounded-xl h-8 text-xs border-gray-200">
            <Edit2 className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl border-gray-200 text-red-500 hover:text-red-600 hover:border-red-200"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
