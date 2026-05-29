'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, Grid, List, Search, FolderPlus, Folder, FolderOpen,
  File, FileVideo, FileText, Copy, Trash2,
  ChevronRight, Image, HardDrive, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FileItem = {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | 'video' | 'file';
  size: string;
  url: string;
  folder: string;
};

const mockFiles: FileItem[] = [
  { id: '1', name: 'hero-banner.jpg', type: 'image', size: '2.4 MB', url: 'https://cdn.qestron.io/hero-banner.jpg', folder: 'images' },
  { id: '2', name: 'product-1.jpg', type: 'image', size: '1.1 MB', url: 'https://cdn.qestron.io/product-1.jpg', folder: 'images' },
  { id: '3', name: 'menu.pdf', type: 'pdf', size: '340 KB', url: 'https://cdn.qestron.io/menu.pdf', folder: 'documents' },
  { id: '4', name: 'terms.docx', type: 'document', size: '89 KB', url: 'https://cdn.qestron.io/terms.docx', folder: 'documents' },
  { id: '5', name: 'promo-video.mp4', type: 'video', size: '15.2 MB', url: 'https://cdn.qestron.io/promo-video.mp4', folder: 'videos' },
];

const DEFAULT_FOLDERS = ['images', 'documents', 'videos', 'public'];

const IMAGE_PLACEHOLDERS: Record<string, string> = {
  'hero-banner.jpg': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=200&fit=crop',
  'product-1.jpg': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop',
};

function FileIcon({ type, name, view }: { type: FileItem['type']; name: string; view: 'grid' | 'list' }) {
  const size = view === 'grid' ? 'h-8 w-8' : 'h-5 w-5';
  if (type === 'image') {
    const src = IMAGE_PLACEHOLDERS[name];
    if (src) {
      return (
        <div className={view === 'grid' ? 'w-full aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3' : ''}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={name} className="w-full h-full object-cover" />
        </div>
      );
    }
    return <Image className={`${size} text-blue-400`} />;
  }
  if (type === 'pdf') return <FileText className={`${size} text-red-400`} />;
  if (type === 'document') return <FileText className={`${size} text-blue-400`} />;
  if (type === 'video') return <FileVideo className={`${size} text-violet-400`} />;
  return <File className={`${size} text-gray-400`} />;
}

function getFileTypeBg(type: FileItem['type']) {
  const map = {
    image: 'bg-blue-50',
    pdf: 'bg-red-50',
    document: 'bg-blue-50',
    video: 'bg-violet-50',
    file: 'bg-gray-50',
  };
  return map[type];
}

export default function FileManagerPage() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS);
  const [activeFolder, setActiveFolder] = useState<string>('images');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['images']));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const dropRef = useRef<HTMLDivElement>(null);

  const visibleFiles = files.filter(f => {
    const inFolder = activeFolder === 'all' ? true : f.folder === activeFolder;
    const matchesSearch = search ? f.name.toLowerCase().includes(search.toLowerCase()) : true;
    return inFolder && matchesSearch;
  });

  const totalSizeMB = files.reduce((acc, f) => {
    const num = parseFloat(f.size);
    const unit = f.size.split(' ')[1];
    return acc + (unit === 'MB' ? num : unit === 'GB' ? num * 1024 : num / 1024);
  }, 0);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder); else next.add(folder);
      return next;
    });
    setActiveFolder(folder);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => {
      const type: FileItem['type'] = file.type.startsWith('image/') ? 'image'
        : file.type === 'application/pdf' ? 'pdf'
        : file.type.startsWith('video/') ? 'video'
        : 'document';
      const sizeKB = file.size / 1024;
      const sizeFmt = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${Math.round(sizeKB)} KB`;
      setFiles(prev => [...prev, {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type,
        size: sizeFmt,
        url: `https://cdn.qestron.io/${activeFolder}/${file.name}`,
        folder: activeFolder,
      }]);
    });
  }, [activeFolder]);

  const copyCdnUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleAddFolder = () => {
    const name = newFolderName.trim().toLowerCase().replace(/\s+/g, '-');
    if (name && !folders.includes(name)) {
      setFolders(prev => [...prev, name]);
      setActiveFolder(name);
    }
    setNewFolderMode(false);
    setNewFolderName('');
  };

  const folderFileCount = (folder: string) => files.filter(f => f.folder === folder).length;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div>
          <h1 className="text-xl font-bold text-gray-900">File Manager</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage and serve files via CDN</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Folder Tree */}
        <div className="w-52 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
          <div className="flex-1 overflow-y-auto p-3">
            {/* Root */}
            <button
              onClick={() => setActiveFolder('all')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-1 ${
                activeFolder === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <HardDrive className="h-4 w-4 flex-shrink-0" />
              <span>My Files</span>
              <span className="ml-auto text-xs opacity-60">{files.length}</span>
            </button>

            <div className="mt-2 space-y-0.5">
              {folders.map(folder => {
                const isActive = activeFolder === folder;
                const isExpanded = expandedFolders.has(folder);
                const count = folderFileCount(folder);
                return (
                  <button
                    key={folder}
                    onClick={() => toggleFolder(folder)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                      isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronRight className={`h-3 w-3 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    {isActive ? <FolderOpen className="h-4 w-4 flex-shrink-0" /> : <Folder className="h-4 w-4 flex-shrink-0" />}
                    <span className="capitalize truncate flex-1 text-left">{folder}</span>
                    {count > 0 && <span className="text-xs opacity-60">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* New Folder */}
          <div className="p-3 border-t border-gray-100">
            {newFolderMode ? (
              <div className="flex gap-1.5">
                <Input
                  autoFocus
                  placeholder="folder-name"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') { setNewFolderMode(false); setNewFolderName(''); } }}
                  className="h-7 text-xs"
                />
                <Button size="sm" className="h-7 w-7 p-0 bg-gray-900 text-white" onClick={handleAddFolder}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setNewFolderMode(false); setNewFolderName(''); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs h-8"
                onClick={() => setNewFolderMode(true)}
              >
                <FolderPlus className="h-3.5 w-3.5" />
                New Folder
              </Button>
            )}
          </div>
        </div>

        {/* Right Main Area */}
        <div
          ref={dropRef}
          className="flex-1 flex flex-col overflow-hidden relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-blue-50/90 border-2 border-dashed border-blue-400 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <Upload className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                <p className="text-lg font-semibold text-blue-700">Drop files to upload</p>
                <p className="text-sm text-blue-500">Files will be uploaded to <strong>{activeFolder}</strong></p>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 flex-wrap">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-gray-600 flex-1">
              <HardDrive className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-400">/</span>
              <span className="font-medium text-gray-900 capitalize">{activeFolder === 'all' ? 'My Files' : activeFolder}</span>
            </div>

            {/* Search */}
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Upload */}
            <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800 gap-1.5 h-8 text-xs">
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Button>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* File Grid / List */}
          <div className="flex-1 overflow-y-auto p-5">
            {visibleFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Folder className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No files here yet</p>
                <p className="text-xs text-gray-400 mt-1">Drag & drop files or click Upload</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {visibleFiles.map(file => (
                  <div
                    key={file.id}
                    className="bg-white border border-gray-200/60 rounded-2xl p-3 hover:shadow-md transition-all group"
                  >
                    {/* Thumbnail / Icon */}
                    {file.type === 'image' && IMAGE_PLACEHOLDERS[file.name] ? (
                      <div className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={IMAGE_PLACEHOLDERS[file.name]} alt={file.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-full aspect-video ${getFileTypeBg(file.type)} rounded-xl flex items-center justify-center mb-3`}>
                        <FileIcon type={file.type} name={file.name} view="grid" />
                      </div>
                    )}

                    {/* File Info */}
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{file.size}</p>

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs gap-1"
                        onClick={() => copyCdnUrl(file.id, file.url)}
                      >
                        {copiedId === file.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {copiedId === file.id ? 'Copied!' : 'CDN URL'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                        onClick={() => deleteFile(file.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">Name</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">Folder</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-gray-500">Size</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFiles.map(file => (
                      <tr key={file.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-lg ${getFileTypeBg(file.type)} flex items-center justify-center flex-shrink-0`}>
                              <FileIcon type={file.type} name={file.name} view="list" />
                            </div>
                            <span className="font-medium text-gray-900">{file.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{file.folder}</span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-500">{file.size}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 px-2.5"
                              onClick={() => copyCdnUrl(file.id, file.url)}
                            >
                              {copiedId === file.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              CDN URL
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                              onClick={() => deleteFile(file.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="bg-white border-t border-gray-100 px-5 py-2 flex items-center gap-4 text-xs text-gray-400">
            <span>{visibleFiles.length} file{visibleFiles.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{(totalSizeMB / 1024).toFixed(2)} GB used of 10 GB</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min((totalSizeMB / 1024 / 10) * 100, 100)}%` }}
                />
              </div>
              <span>{((totalSizeMB / 1024 / 10) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
