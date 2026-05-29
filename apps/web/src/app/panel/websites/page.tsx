'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe2, Plus, Eye, Edit3, Trash2, ExternalLink,
  LayoutTemplate, TrendingUp, FileText, MoreHorizontal,
  CheckCircle2, Clock, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface WebPage {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft';
  views: number;
  updatedAt: string;
  sections: number;
}

const mockPages: WebPage[] = [
  { id: '1', title: 'Home', slug: '/', status: 'published', views: 2847, updatedAt: '2024-01-15', sections: 5 },
  { id: '2', title: 'About Us', slug: '/about', status: 'published', views: 1203, updatedAt: '2024-01-14', sections: 3 },
  { id: '3', title: 'Services', slug: '/services', status: 'draft', views: 0, updatedAt: '2024-01-13', sections: 2 },
  { id: '4', title: 'Contact', slug: '/contact', status: 'published', views: 876, updatedAt: '2024-01-12', sections: 2 },
  { id: '5', title: 'Booking', slug: '/book', status: 'draft', views: 0, updatedAt: '2024-01-11', sections: 1 },
];

function PageThumbnail({ title, status }: { title: string; status: string }) {
  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-40">
        <LayoutTemplate className="h-8 w-8 text-gray-400" />
      </div>
      <div className="absolute inset-0 flex flex-col p-3 gap-1.5 opacity-20">
        <div className="h-2 bg-gray-500 rounded-full w-3/4" />
        <div className="h-1.5 bg-gray-400 rounded-full w-1/2" />
        <div className="mt-1 h-1 bg-gray-400 rounded-full w-full" />
        <div className="h-1 bg-gray-400 rounded-full w-5/6" />
        <div className="h-1 bg-gray-400 rounded-full w-4/6" />
        <div className="mt-1 grid grid-cols-3 gap-1">
          <div className="h-4 bg-gray-400 rounded" />
          <div className="h-4 bg-gray-400 rounded" />
          <div className="h-4 bg-gray-400 rounded" />
        </div>
      </div>
      {status === 'published' && (
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
      )}
    </div>
  );
}

function PageCard({ page, onEdit, onToggleStatus, onDelete }: {
  page: WebPage;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const relativeTime = (() => {
    try {
      return formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true });
    } catch {
      return page.updatedAt;
    }
  })();

  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md hover:border-gray-300/60 transition-all duration-200">
      {/* Thumbnail */}
      <div className="p-3 pb-0">
        <PageThumbnail title={page.title} status={page.status} />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{page.title}</h3>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 w-40 bg-white border border-gray-200/60 rounded-xl shadow-lg z-20 py-1">
                <button
                  onClick={() => { onEdit(page.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => window.open(page.slug, '_blank')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Preview
                </button>
                <button
                  onClick={() => { onToggleStatus(page.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  {page.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { onDelete(page.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 font-mono mb-3">{page.slug}</p>

        <div className="flex items-center justify-between">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            page.status === 'published'
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-500"
          )}>
            {page.status === 'published'
              ? <CheckCircle2 className="h-3 w-3" />
              : <Clock className="h-3 w-3" />}
            {page.status === 'published' ? 'Published' : 'Draft'}
          </span>
          {page.views > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="h-3 w-3" />
              {page.views.toLocaleString()}
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">{relativeTime}</span>
          <span className="text-xs text-gray-400">{page.sections} section{page.sections !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Quick Edit action (shows on hover) */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onEdit(page.id)}
          className="w-full py-2 rounded-xl bg-gray-900 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-700"
        >
          Open Builder
        </button>
      </div>
    </div>
  );
}

export default function WebsitesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<WebPage[]>(mockPages);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  const published = pages.filter(p => p.status === 'published');
  const drafts = pages.filter(p => p.status === 'draft');
  const totalViews = pages.reduce((sum, p) => sum + p.views, 0);

  const handleEdit = (id: string) => {
    router.push(`/panel/websites/builder/${id}`);
  };

  const handleToggleStatus = (id: string) => {
    setPages(prev => prev.map(p =>
      p.id === id
        ? { ...p, status: p.status === 'published' ? 'draft' : 'published' }
        : p
    ));
  };

  const handleDelete = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleCreatePage = () => {
    if (!newPageTitle.trim()) return;
    const slug = newPageSlug.trim() || `/${newPageTitle.toLowerCase().replace(/\s+/g, '-')}`;
    const newPage: WebPage = {
      id: Date.now().toString(),
      title: newPageTitle.trim(),
      slug,
      status: 'draft',
      views: 0,
      updatedAt: new Date().toISOString().split('T')[0],
      sections: 0,
    };
    setPages(prev => [...prev, newPage]);
    setNewPageTitle('');
    setNewPageSlug('');
    setShowNewModal(false);
    router.push(`/panel/websites/builder/${newPage.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Websites</h1>
          <p className="text-sm text-gray-500 mt-0.5">Build and publish web pages for your brand</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Page
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{published.length}</p>
              <p className="text-xs text-gray-500">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{drafts.length}</p>
              <p className="text-xs text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pages grid */}
      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Globe2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No pages yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first page to get started</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(page => (
            <PageCard
              key={page.id}
              page={page}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
          {/* Add new card */}
          <button
            onClick={() => setShowNewModal(true)}
            className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all duration-200 min-h-[280px]"
          >
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">New Page</span>
          </button>
        </div>
      )}

      {/* New Page Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Create New Page</h2>
            <p className="text-sm text-gray-500 mb-5">Give your page a title and URL slug</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Title</label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={e => setNewPageTitle(e.target.value)}
                  placeholder="e.g. Landing Page"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent">
                  <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">yourdomain.com</span>
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={e => setNewPageSlug(e.target.value)}
                    placeholder="/page-slug"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => { setShowNewModal(false); setNewPageTitle(''); setNewPageSlug(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePage}
                disabled={!newPageTitle.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create & Open Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
