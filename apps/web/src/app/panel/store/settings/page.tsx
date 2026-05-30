'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type ShippingZone = {
  id: string;
  name: string;
  states: string;
  rate: number;
  freeAbove: number;
};

// ─── Mock state defaults ─────────────────────────────────────────────────────

const initialZones: ShippingZone[] = [
  { id: '1', name: 'Metro Cities', states: 'MH, DL, KA, TN', rate: 49, freeAbove: 499 },
  { id: '2', name: 'Rest of India', states: 'All other states', rate: 79, freeAbove: 699 },
];

const PAYMENT_METHODS = [
  { key: 'upi', label: 'UPI', description: 'PhonePe, GPay, Paytm', defaultOn: true },
  { key: 'cards', label: 'Cards', description: 'Credit & Debit cards', defaultOn: true },
  { key: 'netbanking', label: 'Net Banking', description: 'All major banks', defaultOn: true },
  { key: 'wallets', label: 'Wallets', description: 'Freecharge, Mobikwik', defaultOn: true },
  { key: 'emi', label: 'EMI', description: 'Easy monthly instalments', defaultOn: false },
  { key: 'cod', label: 'Cash on Delivery', description: 'Pay on delivery', defaultOn: false },
];

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function PaymentsTab() {
  const [keyId, setKeyId] = useState('rzp_test_xxxxxxxx');
  const [keySecret, setKeySecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [methods, setMethods] = useState<Record<string, boolean>>(
    Object.fromEntries(PAYMENT_METHODS.map((m) => [m.key, m.defaultOn])),
  );
  const [connected, setConnected] = useState(false);

  return (
    <div className="space-y-6">
      {/* Razorpay */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Razorpay</h3>
            <p className="text-xs text-gray-400 mt-0.5">Accept payments via Razorpay gateway</p>
          </div>
          {connected && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">Connected</span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Key ID</Label>
            <Input value={keyId} onChange={(e) => setKeyId(e.target.value)} placeholder="rzp_live_..." className="rounded-xl border-gray-200 font-mono text-sm" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Key Secret</Label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
                placeholder="Enter your key secret"
                className="rounded-xl border-gray-200 font-mono text-sm pr-10"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-700">Test Mode</p>
              <p className="text-xs text-gray-400">Use test credentials (no real charges)</p>
            </div>
            <Switch checked={testMode} onCheckedChange={setTestMode} />
          </div>

          <Button onClick={() => setConnected(true)} className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl">
            {connected ? 'Reconnect' : 'Connect Razorpay'}
          </Button>
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Payment Methods</h3>
        <p className="text-xs text-gray-400 mb-5">Choose which payment methods to offer</p>
        <div className="space-y-3">
          {PAYMENT_METHODS.map((method) => (
            <div key={method.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{method.label}</p>
                <p className="text-xs text-gray-400">{method.description}</p>
              </div>
              <Switch checked={methods[method.key]} onCheckedChange={(v) => setMethods((m) => ({ ...m, [method.key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Currency</h3>
        <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <span className="text-2xl">₹</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Indian Rupee (INR)</p>
            <p className="text-xs text-gray-400">Fixed currency for all transactions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShippingTab() {
  const [zones, setZones] = useState<ShippingZone[]>(initialZones);
  const [shiprocketKey, setShiprocketKey] = useState('');
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZone, setNewZone] = useState<Omit<ShippingZone, 'id'>>({ name: '', states: '', rate: 49, freeAbove: 499 });

  function handleAddZone() {
    setZones((prev) => [...prev, { id: String(Date.now()), ...newZone }]);
    setNewZone({ name: '', states: '', rate: 49, freeAbove: 499 });
    setShowAddZone(false);
  }

  return (
    <div className="space-y-6">
      {/* Shipping zones */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Shipping Zones</h3>
            <p className="text-xs text-gray-400 mt-0.5">Set rates by geographic zone</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddZone(true)} className="rounded-xl border-gray-200 text-sm">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Zone
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Zone</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">States</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Rate (₹)</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Free above (₹)</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id} className="border-b border-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900">{zone.name}</td>
                  <td className="py-3 px-3 text-gray-500 text-xs">{zone.states}</td>
                  <td className="py-3 px-3 text-gray-900">₹{zone.rate}</td>
                  <td className="py-3 px-3 text-gray-900">₹{zone.freeAbove}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-red-500 hover:text-red-600" onClick={() => setZones((z) => z.filter((zz) => zz.id !== zone.id))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shiprocket */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Shiprocket</h3>
        <p className="text-xs text-gray-400 mb-4">Automate shipping & tracking with Shiprocket</p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">API Key</Label>
            <Input value={shiprocketKey} onChange={(e) => setShiprocketKey(e.target.value)} placeholder="Enter Shiprocket API key" className="rounded-xl border-gray-200" />
          </div>
          <Button className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl">Connect Shiprocket</Button>
        </div>
      </div>

      {/* Add Zone Dialog */}
      <Dialog open={showAddZone} onOpenChange={setShowAddZone}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Add Shipping Zone</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: 'Zone Name', key: 'name' as const, placeholder: 'e.g. Metro Cities' },
              { label: 'States (comma separated)', key: 'states' as const, placeholder: 'MH, DL, KA' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</Label>
                <Input placeholder={placeholder} value={String(newZone[key])} onChange={(e) => setNewZone((z) => ({ ...z, [key]: e.target.value }))} className="rounded-xl border-gray-200" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Shipping Rate (₹)', key: 'rate' as const },
                { label: 'Free above (₹)', key: 'freeAbove' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</Label>
                  <Input type="number" value={newZone[key]} onChange={(e) => setNewZone((z) => ({ ...z, [key]: parseFloat(e.target.value) || 0 }))} className="rounded-xl border-gray-200" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddZone(false)} className="rounded-xl border-gray-200">Cancel</Button>
              <Button onClick={handleAddZone} className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl">Add Zone</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StoreDetailsTab() {
  const [form, setForm] = useState({
    name: 'My Questron Store',
    email: 'store@example.com',
    phone: '+91 98765 43210',
    address: '123 MG Road, Bengaluru, Karnataka 560001',
    gstin: '',
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Store Details</h3>
        <p className="text-xs text-gray-400 mt-0.5">Basic information about your store</p>
      </div>

      {/* Logo upload */}
      <div>
        <Label className="text-xs font-semibold text-gray-600 mb-2 block">Store Logo</Label>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors cursor-pointer">
          <div className="h-12 w-12 rounded-xl bg-gray-900 flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          <p className="text-sm text-gray-500">Click to upload logo</p>
          <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 2MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          { label: 'Store Name', key: 'name' as const, placeholder: 'My Store' },
          { label: 'Store Email', key: 'email' as const, placeholder: 'store@example.com' },
          { label: 'Phone', key: 'phone' as const, placeholder: '+91 98765 43210' },
          { label: 'GSTIN', key: 'gstin' as const, placeholder: '27AAPFU0939F1ZV' },
        ] as const).map(({ label, key, placeholder }) => (
          <div key={key}>
            <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</Label>
            <Input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="rounded-xl border-gray-200" />
          </div>
        ))}
      </div>

      <div>
        <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Address</Label>
        <Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Full store address" className="rounded-xl border-gray-200 min-h-20 resize-none" />
      </div>

      <Button onClick={handleSave} className={cn('rounded-xl', saved ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-900 text-white hover:bg-gray-800')}>
        <Save className="h-4 w-4 mr-2" />
        {saved ? 'Saved!' : 'Save Changes'}
      </Button>
    </div>
  );
}

function TaxTab() {
  const [gstin, setGstin] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [includeTax, setIncludeTax] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Tax Settings</h3>
        <p className="text-xs text-gray-400 mt-0.5">Configure GST and tax rates for your store</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">GSTIN</Label>
          <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="27AAPFU0939F1ZV" className="rounded-xl border-gray-200 font-mono" />
          <p className="text-xs text-gray-400 mt-1">15-digit GST Identification Number</p>
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">Default Tax Rate (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="rounded-xl border-gray-200 w-28"
              min={0}
              max={100}
            />
            <span className="text-sm text-gray-500">% GST</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-700">Include tax in prices</p>
            <p className="text-xs text-gray-400 mt-0.5">Product prices shown include tax amount</p>
          </div>
          <Switch checked={includeTax} onCheckedChange={setIncludeTax} />
        </div>

        {!includeTax && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700">Tax will be added at checkout. Customers see tax separately.</p>
          </div>
        )}
      </div>

      <Button onClick={handleSave} className={cn('rounded-xl', saved ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-900 text-white hover:bg-gray-800')}>
        <Save className="h-4 w-4 mr-2" />
        {saved ? 'Saved!' : 'Save Tax Settings'}
      </Button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StoreSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your store, payments, and shipping</p>
      </div>

      <Tabs defaultValue="payments" className="space-y-5">
        <TabsList className="bg-white border border-gray-200 rounded-2xl p-1.5 h-auto gap-1 shadow-sm">
          {[
            { value: 'payments', label: 'Payments' },
            { value: 'shipping', label: 'Shipping' },
            { value: 'details', label: 'Store Details' },
            { value: 'tax', label: 'Tax' },
          ].map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm text-sm px-4 py-2"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="payments"><PaymentsTab /></TabsContent>
        <TabsContent value="shipping"><ShippingTab /></TabsContent>
        <TabsContent value="details"><StoreDetailsTab /></TabsContent>
        <TabsContent value="tax"><TaxTab /></TabsContent>
      </Tabs>
    </div>
  );
}
