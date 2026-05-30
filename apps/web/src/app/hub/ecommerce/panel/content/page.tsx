import { FileText } from 'lucide-react';
export default function ContentPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-[22px] font-semibold text-gray-900 mb-2">Content</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your store pages, blogs, and files.</p>
      <div className="grid grid-cols-2 gap-4">
        {['Blog posts','Pages','Files','Themes'].map(item => (
          <div key={item} className="bg-white rounded-xl border border-[#e1e3e5] p-5 shadow-sm hover:shadow-md cursor-pointer transition-shadow">
            <FileText className="w-6 h-6 text-gray-400 mb-3" />
            <p className="text-[14px] font-semibold text-gray-900">{item}</p>
            <p className="text-[12px] text-gray-500 mt-1">0 items</p>
          </div>
        ))}
      </div>
    </div>
  );
}
