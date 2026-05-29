'use client';

export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Undo2, Redo2, Eye, Globe2, MoreHorizontal,
  ChevronUp, ChevronDown, Copy, Trash2, Plus,
  Layout, Type, Image, Video, Minus, Star,
  ShoppingCart, MessageSquare, Calendar, Clock,
  Zap, Grid, AlignLeft, Phone, DollarSign,
  Package, BookOpen, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface BlockItem {
  id: string;
  type: string;
  props: Record<string, any>;
}

interface BlockDef {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultProps: Record<string, any>;
}

// ─────────────────────────────────────────────────────────
// Block palette definitions
// ─────────────────────────────────────────────────────────

const BLOCK_CATEGORIES: { category: string; blocks: BlockDef[] }[] = [
  {
    category: 'Layout',
    blocks: [
      { type: 'hero', label: 'Hero', icon: Layout, defaultProps: { heading: 'Welcome to Our Site', subheading: 'Discover amazing things', ctaText: 'Get Started', ctaUrl: '#', bgColor: '#6366f1' } },
      { type: 'two-col', label: '2-Col', icon: Grid, defaultProps: { content: 'Two column layout' } },
      { type: 'three-col', label: '3-Col', icon: Grid, defaultProps: { content: 'Three column layout' } },
      { type: 'full-width', label: 'Full Width', icon: AlignLeft, defaultProps: { content: 'Full width section' } },
    ],
  },
  {
    category: 'Content',
    blocks: [
      { type: 'heading', label: 'Heading', icon: Type, defaultProps: { text: 'Section Heading', level: 'h2' } },
      { type: 'paragraph', label: 'Paragraph', icon: AlignLeft, defaultProps: { text: 'Add your content here. Click to edit this paragraph.' } },
      { type: 'image', label: 'Image', icon: Image, defaultProps: { src: '', alt: 'Image', caption: '' } },
      { type: 'video', label: 'Video', icon: Video, defaultProps: { url: '', caption: '' } },
      { type: 'divider', label: 'Divider', icon: Minus, defaultProps: { style: 'solid' } },
    ],
  },
  {
    category: 'Components',
    blocks: [
      { type: 'features', label: 'Features', icon: Star, defaultProps: { heading: 'Our Features', items: [{ title: 'Feature 1', description: 'Description here' }, { title: 'Feature 2', description: 'Description here' }, { title: 'Feature 3', description: 'Description here' }] } },
      { type: 'testimonials', label: 'Testimonials', icon: MessageSquare, defaultProps: { heading: 'What People Say', items: [{ name: 'Jane Doe', quote: 'Amazing product!', role: 'CEO' }] } },
      { type: 'cta', label: 'CTA', icon: Zap, defaultProps: { heading: 'Ready to get started?', subheading: 'Join thousands of happy customers', buttonText: 'Get Started', buttonUrl: '#', bgColor: '#10b981' } },
      { type: 'contact-form', label: 'Contact Form', icon: Phone, defaultProps: { title: 'Contact Us', emailField: true, phoneField: true, messageField: true, submitText: 'Send Message' } },
      { type: 'pricing', label: 'Pricing Table', icon: DollarSign, defaultProps: { heading: 'Our Plans', content: 'Pricing plans' } },
    ],
  },
  {
    category: 'Commerce',
    blocks: [
      { type: 'product-grid', label: 'Product Grid', icon: Package, defaultProps: { heading: 'Our Products', columns: 3 } },
      { type: 'add-to-cart', label: 'Add to Cart', icon: ShoppingCart, defaultProps: { productId: '', buttonText: 'Add to Cart' } },
      { type: 'reviews', label: 'Reviews', icon: Star, defaultProps: { heading: 'Customer Reviews' } },
    ],
  },
  {
    category: 'Booking',
    blocks: [
      { type: 'booking-widget', label: 'Booking Widget', icon: Calendar, defaultProps: { title: 'Book an Appointment', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], timeFrom: '09:00', timeTo: '17:00' } },
      { type: 'calendar', label: 'Calendar', icon: Calendar, defaultProps: { title: 'Availability Calendar' } },
      { type: 'time-slots', label: 'Time Slots', icon: Clock, defaultProps: { title: 'Available Times' } },
    ],
  },
];

// ─────────────────────────────────────────────────────────
// Canvas block visuals
// ─────────────────────────────────────────────────────────

function BlockPreview({ block }: { block: BlockItem }) {
  const { type, props } = block;

  switch (type) {
    case 'hero':
      return (
        <div className="h-32 rounded-xl flex flex-col items-center justify-center text-white font-bold gap-1" style={{ background: `linear-gradient(135deg, ${props.bgColor || '#6366f1'}, #a855f7)` }}>
          <p className="text-lg font-bold">{props.heading}</p>
          <p className="text-sm font-normal opacity-80">{props.subheading}</p>
          <div className="mt-1 px-4 py-1 bg-white/20 rounded-full text-xs">{props.ctaText}</div>
        </div>
      );
    case 'features':
      return (
        <div className="h-24 bg-blue-50 border-2 border-blue-200 rounded-xl flex flex-col items-center justify-center gap-1">
          <p className="text-sm font-semibold text-blue-700">{props.heading}</p>
          <div className="flex gap-3">
            {(props.items || []).slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">{item.title}</div>
            ))}
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div className="h-20 bg-yellow-50 border-2 border-yellow-200 rounded-xl flex items-center justify-center">
          <p className="text-sm font-medium text-yellow-700">✦ {props.heading}</p>
        </div>
      );
    case 'cta':
      return (
        <div className="h-16 border-2 border-green-200 rounded-xl flex items-center justify-center gap-3" style={{ backgroundColor: `${props.bgColor}18` || '#d1fae5' }}>
          <p className="text-sm font-semibold text-green-800">{props.heading}</p>
          <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">{props.buttonText}</span>
        </div>
      );
    case 'contact-form':
      return (
        <div className="h-28 bg-gray-50 border-2 border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-semibold text-gray-700">{props.title}</p>
          <div className="flex gap-2">
            {props.emailField && <div className="h-5 w-20 bg-white border border-gray-300 rounded text-[10px] flex items-center pl-1 text-gray-400">Email</div>}
            {props.phoneField && <div className="h-5 w-20 bg-white border border-gray-300 rounded text-[10px] flex items-center pl-1 text-gray-400">Phone</div>}
          </div>
          <div className="px-4 py-1 bg-gray-800 text-white text-xs rounded-full">{props.submitText}</div>
        </div>
      );
    case 'product-grid':
      return (
        <div className="h-24 bg-orange-50 border-2 border-orange-200 rounded-xl flex flex-col items-center justify-center gap-1">
          <p className="text-sm font-semibold text-orange-700">{props.heading}</p>
          <div className="grid grid-cols-3 gap-1 mt-1">
            {[0,1,2].map(i => <div key={i} className="h-6 w-10 bg-orange-100 rounded border border-orange-200" />)}
          </div>
        </div>
      );
    case 'booking-widget':
      return (
        <div className="h-28 bg-purple-50 border-2 border-purple-200 rounded-xl flex flex-col items-center justify-center gap-1">
          <p className="text-sm font-semibold text-purple-700">{props.title}</p>
          <div className="flex gap-1">
            {(props.days || []).map((d: string) => (
              <div key={d} className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">{d}</div>
            ))}
          </div>
          <p className="text-[10px] text-purple-500">{props.timeFrom} – {props.timeTo}</p>
        </div>
      );
    case 'heading':
      return (
        <div className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-center">
          <p className={cn("font-bold text-gray-800", props.level === 'h1' ? 'text-2xl' : props.level === 'h3' ? 'text-lg' : 'text-xl')}>{props.text}</p>
        </div>
      );
    case 'paragraph':
      return (
        <div className="h-16 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center px-4">
          <p className="text-sm text-gray-600 line-clamp-2">{props.text}</p>
        </div>
      );
    case 'image':
      return (
        <div className="h-20 bg-gray-100 border-2 border-gray-200 rounded-xl flex items-center justify-center gap-2">
          <Image className="h-6 w-6 text-gray-400" />
          <span className="text-sm text-gray-400">{props.alt || 'Image block'}</span>
        </div>
      );
    case 'video':
      return (
        <div className="h-20 bg-gray-900 border-2 border-gray-700 rounded-xl flex items-center justify-center gap-2">
          <Video className="h-6 w-6 text-white/60" />
          <span className="text-sm text-white/60">Video block</span>
        </div>
      );
    case 'divider':
      return (
        <div className="h-8 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-center px-4">
          <div className="h-px bg-gray-300 w-full" />
        </div>
      );
    case 'pricing':
      return (
        <div className="h-20 bg-indigo-50 border-2 border-indigo-200 rounded-xl flex items-center justify-center">
          <p className="text-sm font-semibold text-indigo-700">{props.heading}</p>
        </div>
      );
    case 'add-to-cart':
      return (
        <div className="h-16 bg-orange-50 border-2 border-orange-200 rounded-xl flex items-center justify-center gap-3">
          <ShoppingCart className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium text-orange-700">{props.buttonText}</span>
        </div>
      );
    case 'reviews':
      return (
        <div className="h-20 bg-yellow-50 border-2 border-yellow-200 rounded-xl flex flex-col items-center justify-center gap-1">
          <div className="flex gap-0.5">{[0,1,2,3,4].map(i => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}</div>
          <p className="text-xs text-yellow-700">{props.heading}</p>
        </div>
      );
    case 'calendar':
      return (
        <div className="h-20 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center justify-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium text-blue-700">{props.title}</span>
        </div>
      );
    case 'time-slots':
      return (
        <div className="h-16 bg-teal-50 border-2 border-teal-200 rounded-xl flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-teal-500" />
          <span className="text-sm font-medium text-teal-700">{props.title}</span>
        </div>
      );
    default:
      return (
        <div className="h-16 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-center">
          <span className="text-sm text-gray-500 capitalize">{type.replace(/-/g, ' ')} block</span>
        </div>
      );
  }
}

// ─────────────────────────────────────────────────────────
// Properties Panel
// ─────────────────────────────────────────────────────────

function PropertiesPanel({ block, onUpdate }: {
  block: BlockItem | null;
  onUpdate: (id: string, key: string, value: any) => void;
}) {
  if (!block) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-3">
        <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
          <Layout className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">Select a block to edit its properties</p>
      </div>
    );
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );

  const Input = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
    />
  );

  const Textarea = ({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white resize-none"
    />
  );

  const ColorInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 w-10 rounded border border-gray-200 cursor-pointer p-0.5"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
      />
    </div>
  );

  const set = (key: string, value: any) => onUpdate(block.id, key, value);
  const p = block.props;

  const renderProps = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <Field label="Heading">
              <Input value={p.heading || ''} onChange={v => set('heading', v)} placeholder="Main headline" />
            </Field>
            <Field label="Subheading">
              <Textarea value={p.subheading || ''} onChange={v => set('subheading', v)} placeholder="Supporting text" rows={2} />
            </Field>
            <Field label="CTA Button Text">
              <Input value={p.ctaText || ''} onChange={v => set('ctaText', v)} placeholder="Get Started" />
            </Field>
            <Field label="CTA URL">
              <Input value={p.ctaUrl || ''} onChange={v => set('ctaUrl', v)} placeholder="https://..." />
            </Field>
            <Field label="Background Color">
              <ColorInput value={p.bgColor || '#6366f1'} onChange={v => set('bgColor', v)} />
            </Field>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            <Field label="Section Heading">
              <Input value={p.heading || ''} onChange={v => set('heading', v)} placeholder="Our Features" />
            </Field>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Feature Items</label>
                <button
                  onClick={() => set('items', [...(p.items || []), { title: 'New Feature', description: 'Description' }])}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >+ Add</button>
              </div>
              <div className="space-y-3">
                {(p.items || []).map((item: any, i: number) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Feature {i + 1}</span>
                      <button
                        onClick={() => set('items', p.items.filter((_: any, j: number) => j !== i))}
                        className="text-xs text-red-400 hover:text-red-600"
                      >Remove</button>
                    </div>
                    <input
                      type="text"
                      value={item.title}
                      onChange={e => {
                        const items = [...p.items];
                        items[i] = { ...items[i], title: e.target.value };
                        set('items', items);
                      }}
                      placeholder="Title"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => {
                        const items = [...p.items];
                        items[i] = { ...items[i], description: e.target.value };
                        set('items', items);
                      }}
                      placeholder="Description"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            <Field label="Heading">
              <Input value={p.heading || ''} onChange={v => set('heading', v)} placeholder="Call to action heading" />
            </Field>
            <Field label="Subheading">
              <Input value={p.subheading || ''} onChange={v => set('subheading', v)} placeholder="Supporting text" />
            </Field>
            <Field label="Button Text">
              <Input value={p.buttonText || ''} onChange={v => set('buttonText', v)} placeholder="Get Started" />
            </Field>
            <Field label="Button URL">
              <Input value={p.buttonUrl || ''} onChange={v => set('buttonUrl', v)} placeholder="https://..." />
            </Field>
            <Field label="Background Color">
              <ColorInput value={p.bgColor || '#10b981'} onChange={v => set('bgColor', v)} />
            </Field>
          </div>
        );

      case 'contact-form':
        return (
          <div className="space-y-4">
            <Field label="Form Title">
              <Input value={p.title || ''} onChange={v => set('title', v)} placeholder="Contact Us" />
            </Field>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Form Fields</label>
              <div className="space-y-2">
                {[
                  { key: 'emailField', label: 'Email Address' },
                  { key: 'phoneField', label: 'Phone Number' },
                  { key: 'messageField', label: 'Message' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                    <div
                      onClick={() => set(key, !p[key])}
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer",
                        p[key] ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                      )}
                    >
                      {p[key] && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Field label="Submit Button Text">
              <Input value={p.submitText || ''} onChange={v => set('submitText', v)} placeholder="Send Message" />
            </Field>
          </div>
        );

      case 'booking-widget':
        return (
          <div className="space-y-4">
            <Field label="Widget Title">
              <Input value={p.title || ''} onChange={v => set('title', v)} placeholder="Book an Appointment" />
            </Field>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Available Days</label>
              <div className="flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                  const selected = (p.days || []).includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        const days = p.days || [];
                        set('days', selected ? days.filter((d: string) => d !== day) : [...days, day]);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                        selected
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <input
                  type="time"
                  value={p.timeFrom || '09:00'}
                  onChange={e => set('timeFrom', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </Field>
              <Field label="To">
                <input
                  type="time"
                  value={p.timeTo || '17:00'}
                  onChange={e => set('timeTo', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </Field>
            </div>
          </div>
        );

      case 'heading':
        return (
          <div className="space-y-4">
            <Field label="Heading Text">
              <Textarea value={p.text || ''} onChange={v => set('text', v)} placeholder="Your heading" rows={2} />
            </Field>
            <Field label="Level">
              <select
                value={p.level || 'h2'}
                onChange={e => set('level', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="h1">H1 — Page Title</option>
                <option value="h2">H2 — Section Title</option>
                <option value="h3">H3 — Subsection</option>
              </select>
            </Field>
          </div>
        );

      case 'paragraph':
        return (
          <div className="space-y-4">
            <Field label="Content">
              <Textarea value={p.text || ''} onChange={v => set('text', v)} placeholder="Paragraph content..." rows={5} />
            </Field>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <Field label="Image URL">
              <Input value={p.src || ''} onChange={v => set('src', v)} placeholder="https://..." />
            </Field>
            <Field label="Alt Text">
              <Input value={p.alt || ''} onChange={v => set('alt', v)} placeholder="Describe the image" />
            </Field>
            <Field label="Caption">
              <Input value={p.caption || ''} onChange={v => set('caption', v)} placeholder="Optional caption" />
            </Field>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <Field label="Video URL">
              <Input value={p.url || ''} onChange={v => set('url', v)} placeholder="YouTube or Vimeo URL" />
            </Field>
            <Field label="Caption">
              <Input value={p.caption || ''} onChange={v => set('caption', v)} placeholder="Optional caption" />
            </Field>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <Field label="Content">
              <Textarea value={p.content || ''} onChange={v => set('content', v)} placeholder="Block content..." rows={4} />
            </Field>
          </div>
        );
    }
  };

  const blockDef = BLOCK_CATEGORIES.flatMap(c => c.blocks).find(b => b.type === block.type);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200/60">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Block Properties</p>
        <p className="text-sm font-semibold text-gray-900">{blockDef?.label || block.type}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {renderProps()}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Canvas Block
// ─────────────────────────────────────────────────────────

function CanvasBlock({ block, isSelected, onSelect, onDelete, onMoveUp, onMoveDown, onDuplicate }: {
  block: BlockItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
}) {
  const blockDef = BLOCK_CATEGORIES.flatMap(c => c.blocks).find(b => b.type === block.type);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative group rounded-xl transition-all duration-150 cursor-pointer",
        isSelected
          ? "ring-2 ring-indigo-500 ring-offset-2"
          : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
      )}
    >
      {/* Block type label (hover) */}
      <div className={cn(
        "absolute -top-6 left-0 px-2 py-0.5 bg-gray-900 text-white text-xs rounded-md font-medium transition-opacity z-10",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        {blockDef?.label || block.type}
      </div>

      {/* Toolbar (selected) */}
      {isSelected && (
        <div className="absolute -top-8 right-0 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-md px-1 py-0.5 z-20">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700" title="Move up">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700" title="Move down">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700" title="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <BlockPreview block={block} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Builder Page
// ─────────────────────────────────────────────────────────

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;

  const [pageTitle, setPageTitle] = useState('Untitled Page');
  const [editingTitle, setEditingTitle] = useState(false);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [history, setHistory] = useState<BlockItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  const pushHistory = useCallback((newBlocks: BlockItem[]) => {
    setHistory(prev => {
      const truncated = prev.slice(0, historyIndex + 1);
      return [...truncated, newBlocks];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const addBlock = (type: string) => {
    const def = BLOCK_CATEGORIES.flatMap(c => c.blocks).find(b => b.type === type);
    if (!def) return;
    const newBlock: BlockItem = {
      id: `${type}-${Date.now()}`,
      type,
      props: { ...def.defaultProps },
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const selectBlock = (id: string) => setSelectedBlockId(id);

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
    setBlocks(newBlocks);
    pushHistory(newBlocks);
  };

  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    const index = blocks.findIndex(b => b.id === id);
    const clone: BlockItem = { ...block, id: `${block.type}-${Date.now()}`, props: { ...block.props } };
    const newBlocks = [...blocks.slice(0, index + 1), clone, ...blocks.slice(index + 1)];
    setBlocks(newBlocks);
    pushHistory(newBlocks);
    setSelectedBlockId(clone.id);
  };

  const updateBlockProp = (id: string, key: string, value: any) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, props: { ...b.props, [key]: value } } : b);
    setBlocks(newBlocks);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBlocks(history[newIndex]);
      setSelectedBlockId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBlocks(history[newIndex]);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#f4f4f5]">
      {/* ── Top Toolbar ── */}
      <div className="flex-shrink-0 h-14 bg-white border-b border-gray-200/60 flex items-center px-4 gap-3 shadow-sm z-10">
        {/* Back */}
        <button
          onClick={() => router.push('/panel/websites')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Websites</span>
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {/* Page title */}
        {editingTitle ? (
          <input
            type="text"
            value={pageTitle}
            onChange={e => setPageTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
            className="text-sm font-semibold text-gray-900 border border-indigo-500 rounded-lg px-2 py-1 focus:outline-none w-40"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors px-1"
          >
            {pageTitle}
          </button>
        )}

        <div className="flex-1" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex === history.length - 1}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <Eye className="h-4 w-4" />
          Preview
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {saved ? <Check className="h-4 w-4 text-emerald-500" /> : null}
          {saved ? 'Saved!' : 'Save Draft'}
        </button>

        <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors">
          <Globe2 className="h-4 w-4" />
          Publish
        </button>

        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* ── 3-Panel Layout ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Panel: Block Palette ── */}
        <div className="w-60 flex-shrink-0 bg-white border-r border-gray-200/60 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Blocks</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {BLOCK_CATEGORIES.map(({ category, blocks: catBlocks }) => (
              <div key={category} className="mb-1">
                <div className="px-4 py-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{category}</p>
                </div>
                <div className="px-2 space-y-0.5">
                  {catBlocks.map(block => {
                    const Icon = block.icon;
                    return (
                      <button
                        key={block.type}
                        onClick={() => addBlock(block.type)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-indigo-500" />
                        <span className="truncate">{block.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Center: Canvas ── */}
        <div
          className="flex-1 overflow-y-auto p-6 flex flex-col items-center"
          onClick={e => { if (e.target === e.currentTarget) setSelectedBlockId(null); }}
        >
          <div className="w-full max-w-2xl">
            {blocks.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Plus className="h-7 w-7 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Click a block on the left to add it</p>
                  <p className="text-xs text-gray-400 mt-1">Your page blocks will appear here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-8">
                {blocks.map(block => (
                  <CanvasBlock
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => selectBlock(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                    onMoveUp={() => moveBlock(block.id, 'up')}
                    onMoveDown={() => moveBlock(block.id, 'down')}
                    onDuplicate={() => duplicateBlock(block.id)}
                  />
                ))}
                {/* Drop zone at bottom */}
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl py-6 flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors cursor-pointer"
                  onClick={() => setSelectedBlockId(null)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm">Add a block</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Properties ── */}
        <div className="w-72 flex-shrink-0 bg-white border-l border-gray-200/60 overflow-hidden flex flex-col">
          <PropertiesPanel block={selectedBlock} onUpdate={updateBlockProp} />
        </div>
      </div>
    </div>
  );
}
