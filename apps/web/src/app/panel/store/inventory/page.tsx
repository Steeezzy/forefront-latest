'use client';

import { useState } from 'react';
import { AlertTriangle, Plus, Minus, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  reserved: number;
  status: 'active' | 'draft';
};

const initialInventory: InventoryItem[] = [
  { id: '1', name: 'Ayurvedic Hair Oil', sku: 'AHO-001', category: 'Health', stock: 234, reserved: 12, status: 'active' },
  { id: '2', name: 'Cotton Kurta Set', sku: 'CKS-023', category: 'Clothing', stock: 45, reserved: 5, status: 'active' },
  { id: '3', name: 'Steel Water Bottle', sku: 'SWB-007', category: 'Home', stock: 5, reserved: 2, status: 'active' },
  { id: '4', name: 'Organic Turmeric', sku: 'OTM-012', category: 'Food', stock: 0, reserved: 0, status: 'active' },
  { id: '5', name: 'Bamboo Toothbrush', sku: 'BTB-004', category: 'Health', stock: 120, reserved: 8, status: 'draft' },
  { id: '6', name: 'Printed Tote Bag', sku: 'PTB-019', category: 'Clothing', stock: 78, reserved: 3, status: 'active' },
  { id: '7', name: 'Aloe Vera Gel', sku: 'AVG-031', category: 'Health', stock: 7, reserved: 1, status: 'active' },
  { id: '8', name: 'Cotton Bed Sheet', sku: 'CBS-011', category: 'Home', stock: 3, reserved: 0, status: 'active' },
];

const REASONS = ['received', 'sold', 'damaged', 'returned', 'adjustment'];

function StockStatus({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">Out of Stock</span>;
  if (stock <= 10) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border-amber-200 font-medium">Low Stock</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">In Stock</span>;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [editingStocks, setEditingStocks] = useState<Record<string, string>>({});
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; item: InventoryItem | null }>({ open: false, item: null });
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustDir, setAdjustDir] = useState<'+' | '-'>('+');
  const [adjustReason, setAdjustReason] = useState('received');

  const lowStockItems = inventory.filter((i) => i.stock > 0 && i.stock <= 10);
  const outOfStockItems = inventory.filter((i) => i.stock === 0);

  function handleUpdateStock(id: string) {
    const newQty = parseInt(editingStocks[id] ?? '');
    if (isNaN(newQty) || newQty < 0) return;
    setInventory((prev) => prev.map((item) => item.id === id ? { ...item, stock: newQty } : item));
    setEditingStocks((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  function handleAdjustStock() {
    if (!adjustDialog.item) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) return;
    const delta = adjustDir === '+' ? qty : -qty;
    setInventory((prev) =>
      prev.map((item) =>
        item.id === adjustDialog.item!.id
          ? { ...item, stock: Math.max(0, item.stock + delta) }
          : item,
      ),
    );
    setAdjustDialog({ open: false, item: null });
    setAdjustQty('');
    setAdjustDir('+');
    setAdjustReason('received');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{inventory.length} products tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-sm">
            <Upload className="h-4 w-4 mr-2" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-sm">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Alert banner */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Inventory Alert</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {outOfStockItems.length > 0 && (
                <span><strong>{outOfStockItems.length}</strong> product{outOfStockItems.length > 1 ? 's' : ''} out of stock. </span>
              )}
              {lowStockItems.length > 0 && (
                <span><strong>{lowStockItems.length}</strong> product{lowStockItems.length > 1 ? 's' : ''} running low (≤ 10 units).</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Inventory table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500">Product</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">SKU</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Category</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">In Stock</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Reserved</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Available</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const available = Math.max(0, item.stock - item.reserved);
                const editing = editingStocks[item.id] !== undefined;
                return (
                  <tr key={item.id} className={cn('border-b border-gray-50 hover:bg-gray-50/30 transition-colors', item.stock === 0 && 'bg-red-50/30', item.stock > 0 && item.stock <= 10 && 'bg-amber-50/30')}>
                    <td className="px-6 py-3.5 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{item.sku}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{item.category}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editing ? editingStocks[item.id] : String(item.stock)}
                          onChange={(e) => setEditingStocks((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          className="w-20 h-8 rounded-lg border-gray-200 text-sm"
                          min={0}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{item.reserved}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn('font-semibold', available === 0 ? 'text-red-500' : available <= 5 ? 'text-amber-600' : 'text-gray-900')}>
                        {available}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><StockStatus stock={item.stock} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {editing && (
                          <Button
                            size="sm"
                            className="h-7 rounded-lg text-xs bg-gray-900 text-white hover:bg-gray-800"
                            onClick={() => handleUpdateStock(item.id)}
                          >
                            Update
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-lg text-xs border-gray-200"
                          onClick={() => setAdjustDialog({ open: true, item })}
                        >
                          Adjust
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog({ open, item: open ? adjustDialog.item : null })}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          {adjustDialog.item && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-900">{adjustDialog.item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Current stock: <strong>{adjustDialog.item.stock}</strong> units</p>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 mb-2 block">Adjustment</Label>
                <div className="flex gap-2">
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setAdjustDir('+')}
                      className={cn('px-3 py-2 text-sm font-semibold transition-colors flex items-center gap-1', adjustDir === '+' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                    <button
                      onClick={() => setAdjustDir('-')}
                      className={cn('px-3 py-2 text-sm font-semibold transition-colors flex items-center gap-1', adjustDir === '-' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}
                    >
                      <Minus className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                  <Input
                    type="number"
                    placeholder="0"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="flex-1 rounded-xl border-gray-200"
                    min={1}
                  />
                </div>
                {adjustQty && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    New stock: <strong>{Math.max(0, adjustDialog.item.stock + (adjustDir === '+' ? parseInt(adjustQty) || 0 : -(parseInt(adjustQty) || 0)))}</strong> units
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 mb-2 block">Reason</Label>
                <Select value={adjustReason} onValueChange={setAdjustReason}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setAdjustDialog({ open: false, item: null })} className="rounded-xl border-gray-200">Cancel</Button>
                <Button onClick={handleAdjustStock} className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl">Apply Adjustment</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
