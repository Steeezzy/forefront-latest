import { Globe2 } from 'lucide-react';
export default function MarketsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-[22px] font-semibold text-gray-900 mb-2">Markets</h1>
      <p className="text-sm text-gray-500 mb-6">Manage where and how you sell your products worldwide.</p>
      <div className="bg-white rounded-xl border border-[#e1e3e5] shadow-sm divide-y divide-[#f3f3f3]">
        {[{name:'India (Primary)',flag:'🇮🇳',status:'Active'},{name:'International',flag:'🌍',status:'Active'}].map(m => (
          <div key={m.name} className="flex items-center justify-between px-5 py-4 hover:bg-[#f9f9f9] cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{m.flag}</span>
              <div>
                <p className="text-[13px] font-medium text-gray-900">{m.name}</p>
                <p className="text-[11px] text-gray-500">1 domain • 1 currency</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
