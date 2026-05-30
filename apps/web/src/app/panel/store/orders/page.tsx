'use client';

import { useState } from 'react';
import {
  Eye, Package, CheckCircle2, Clock, XCircle, RotateCcw,
  Truck, MapPin, Phone, Mail, User, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type OrderItem = { name: string; qty: number; price: number };
type Order = {
  id: string;
  customer: { name: string; email: string; phone: string };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  fulfillment: 'unfulfilled' | 'fulfilled' | 'shipped' | 'delivered';
  date: string;
  transactionId: string;
};

const mockOrders: Order[] = [
  { id: '#1047', customer: { name: 'Raj Kumar', email: 'raj@example.com', phone: '+91 98765 43210' }, items: [{ name: 'Ayurvedic Hair Oil', qty: 2, price: 449 }, { name: 'Organic Turmeric', qty: 1, price: 199 }], subtotal: 1097, tax: 55, shipping: 99, total: 1251, paymentStatus: 'paid', fulfillment: 'unfulfilled', date: '2024-01-15', transactionId: 'pay_ABCD1234' },
  { id: '#1046', customer: { name: 'Priya Singh', email: 'priya@example.com', phone: '+91 87654 32109' }, items: [{ name: 'Cotton Kurta Set', qty: 1, price: 1299 }], subtotal: 1299, tax: 65, shipping: 0, total: 1364, paymentStatus: 'pending', fulfillment: 'unfulfilled', date: '2024-01-15', transactionId: '' },
  { id: '#1045', customer: { name: 'Amit Patel', email: 'amit@example.com', phone: '+91 76543 21098' }, items: [{ name: 'Steel Water Bottle', qty: 2, price: 399 }, { name: 'Bamboo Toothbrush', qty: 3, price: 149 }], subtotal: 1245, tax: 62, shipping: 0, total: 1307, paymentStatus: 'paid', fulfillment: 'shipped', date: '2024-01-14', transactionId: 'pay_EFGH5678' },
  { id: '#1044', customer: { name: 'Sunita Sharma', email: 'sunita@example.com', phone: '+91 65432 10987' }, items: [{ name: 'Printed Tote Bag', qty: 2, price: 299 }], subtotal: 598, tax: 30, shipping: 49, total: 677, paymentStatus: 'failed', fulfillment: 'unfulfilled', date: '2024-01-14', transactionId: '' },
  { id: '#1043', customer: { name: 'Vikram Nair', email: 'vikram@example.com', phone: '+91 54321 09876' }, items: [{ name: 'Ayurvedic Hair Oil', qty: 1, price: 449 }], subtotal: 449, tax: 22, shipping: 49, total: 520, paymentStatus: 'refunded', fulfillment: 'fulfilled', date: '2024-01-13', transactionId: 'pay_IJKL9012' },
  { id: '#1042', customer: { name: 'Anita Joshi', email: 'anita@example.com', phone: '+91 43210 98765' }, items: [{ name: 'Organic Turmeric', qty: 3, price: 199 }, { name: 'Cotton Kurta Set', qty: 1, price: 1299 }], subtotal: 1896, tax: 95, shipping: 0, total: 1991, paymentStatus: 'paid', fulfillment: 'delivered', date: '2024-01-12', transactionId: 'pay_MNOP3456' },
  { id: '#1041', customer: { name: 'Rohan Mehta', email: 'rohan@example.com', phone: '+91 32109 87654' }, items: [{ name: 'Steel Water Bottle', qty: 1, price: 399 }], subtotal: 399, tax: 20, shipping: 49, total: 468, paymentStatus: 'paid', fulfillment: 'shipped', date: '2024-01-11', transactionId: 'pay_QRST7890' },
  { id: '#1040', customer: { name: 'Kavita Rao', email: 'kavita@example.com', phone: '+91 21098 76543' }, items: [{ name: 'Bamboo Toothbrush', qty: 5, price: 149 }], subtotal: 745, tax: 37, shipping: 0, total: 782, paymentStatus: 'pending', fulfillment: 'unfulfilled', date: '2024-01-11', transactionId: '' },
];

const PAYMENT_STYLES: Record<string, { cls: string; label: string }> = {
  paid:     { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Paid' },
  pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Pending' },
  failed:   { cls: 'bg-red-50 text-red-700 border-red-200',             label: 'Failed' },
  refunded: { cls: 'bg-gray-100 text-gray-600 border-gray-200',         label: 'Refunded' },
};

const FULFILLMENT_STYLES: Record<string, { cls: string; label: string }> = {
  unfulfilled: { cls: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Unfulfilled' },
  fulfilled:   { cls: 'bg-blue-50 text-blue-700 border-blue-200',       label: 'Fulfilled' },
  shipped:     { cls: 'bg-violet-50 text-violet-700 border-violet-200', label: 'Shipped' },
  delivered:   { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Delivered' },
};

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN')}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Package },
  { key: 'paid', label: 'Payment Confirmed', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

function getTimelineProgress(order: Order): number {
  if (order.fulfillment === 'delivered') return 4;
  if (order.fulfillment === 'shipped') return 3;
  if (order.paymentStatus === 'paid') return 2;
  return 1;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [tab, setTab] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('shipped');

  const filtered = tab === 'all' ? orders : orders.filter((o) => o.paymentStatus === tab);

  const counts = {
    all: orders.length,
    paid: orders.filter((o) => o.paymentStatus === 'paid').length,
    pending: orders.filter((o) => o.paymentStatus === 'pending').length,
    failed: orders.filter((o) => o.paymentStatus === 'failed').length,
    refunded: orders.filter((o) => o.paymentStatus === 'refunded').length,
  };

  function handleMarkShipped() {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, fulfillment: fulfillmentStatus as Order['fulfillment'] }
          : o,
      ),
    );
    setSelectedOrder((o) => o ? { ...o, fulfillment: fulfillmentStatus as Order['fulfillment'] } : o);
  }

  const timelineProgress = selectedOrder ? getTimelineProgress(selectedOrder) : 0;

  const TABS: Array<{ key: typeof tab; label: string; icon: any }> = [
    { key: 'all', label: 'All', icon: Package },
    { key: 'paid', label: 'Paid', icon: CheckCircle2 },
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'failed', label: 'Failed', icon: XCircle },
    { key: 'refunded', label: 'Refunded', icon: RotateCcw },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">{orders.length} total orders</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-1.5 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === key ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', tab === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500">Order</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Customer</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Items</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Payment</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Fulfillment</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Date</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const ps = PAYMENT_STYLES[order.paymentStatus];
                const fs = FULFILLMENT_STYLES[order.fulfillment];
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-gray-900">{order.id}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{order.customer.name}</p>
                      <p className="text-xs text-gray-400">{order.customer.email}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-500">{order.items.length} item{order.items.length > 1 ? 's' : ''}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">{formatINR(order.total)}</td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', ps.cls)}>
                        {ps.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', fs.cls)}>
                        {fs.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-xs">{formatDate(order.date)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-lg text-xs border-gray-200"
                          onClick={() => { setSelectedOrder(order); setTrackingInput(''); }}
                        >
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                        {order.paymentStatus === 'paid' && order.fulfillment === 'unfulfilled' && (
                          <Button
                            size="sm"
                            className="h-7 rounded-lg text-xs bg-gray-900 text-white hover:bg-gray-800"
                            onClick={() => { setSelectedOrder(order); setTrackingInput(''); }}
                          >
                            <Truck className="h-3 w-3 mr-1" /> Fulfill
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center justify-between">
                  <span>Order {selectedOrder.id}</span>
                  <span className="text-sm font-normal text-gray-500">{formatDate(selectedOrder.date)}</span>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                {/* Status badges */}
                <div className="flex gap-2">
                  <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border', PAYMENT_STYLES[selectedOrder.paymentStatus].cls)}>
                    {PAYMENT_STYLES[selectedOrder.paymentStatus].label}
                  </span>
                  <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border', FULFILLMENT_STYLES[selectedOrder.fulfillment].cls)}>
                    {FULFILLMENT_STYLES[selectedOrder.fulfillment].label}
                  </span>
                </div>

                <Separator />

                {/* Customer Info */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900">{selectedOrder.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{selectedOrder.customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{selectedOrder.customer.phone}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-400">Qty: {item.qty}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{formatINR(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatINR(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">{formatINR(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-gray-900">{selectedOrder.shipping === 0 ? 'Free' : formatINR(selectedOrder.shipping)}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatINR(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Payment details */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Details</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Method</span>
                      <span className="text-gray-900 font-medium">Razorpay</span>
                    </div>
                    {selectedOrder.transactionId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Transaction ID</span>
                        <span className="text-gray-900 font-mono text-xs">{selectedOrder.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Fulfillment */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Fulfillment</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Update Status</Label>
                      <Select value={fulfillmentStatus} onValueChange={setFulfillmentStatus}>
                        <SelectTrigger className="rounded-xl border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                          <SelectItem value="fulfilled">Fulfilled</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Tracking Number</Label>
                      <Input
                        placeholder="e.g. FEDEX123456789"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                    <Button onClick={handleMarkShipped} className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-xl">
                      <Truck className="h-4 w-4 mr-2" />
                      Update Fulfillment
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Order Timeline */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Order Timeline</p>
                  <div className="space-y-0">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const done = idx < timelineProgress;
                      const Icon = step.icon;
                      const isLast = idx === TIMELINE_STEPS.length - 1;
                      return (
                        <div key={step.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                              done ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200',
                            )}>
                              <Icon className={cn('h-3.5 w-3.5', done ? 'text-white' : 'text-gray-300')} />
                            </div>
                            {!isLast && <div className={cn('w-0.5 flex-1 min-h-6', done ? 'bg-gray-900' : 'bg-gray-200')} />}
                          </div>
                          <div className="pb-5">
                            <p className={cn('text-sm font-medium', done ? 'text-gray-900' : 'text-gray-400')}>{step.label}</p>
                            {done && <p className="text-xs text-gray-400">{formatDate(selectedOrder.date)}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
