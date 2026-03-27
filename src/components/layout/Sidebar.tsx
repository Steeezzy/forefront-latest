'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Bot, GitBranch, Users,
  Phone, Megaphone, BookOpen, Hash, CalendarDays,
  Activity, BarChart2, Puzzle, Settings, User,
  MessageSquare, Mic, Zap
} from 'lucide-react';

const CHAT_NAV = [
  { icon: LayoutDashboard, label: 'Home', path: '/panel/dashboard' },
  { icon: Inbox, label: 'Inbox', path: '/panel/inbox' },
  { icon: Bot, label: 'Chatbot', path: '/panel/chatbot' },
  { icon: GitBranch, label: 'Flows', path: '/panel/flows' },
  { icon: Users, label: 'Customers', path: '/panel/customers' },
  { icon: BarChart2, label: 'Analytics', path: '/panel/analytics' },
  { icon: Puzzle, label: 'Integrations', path: '/panel/integrations' },
];

const VOICE_NAV = [
  { icon: Phone, label: 'Voice Agents', path: '/panel/voice-agents' },
  { icon: Megaphone, label: 'Campaigns', path: '/panel/campaigns' },
  { icon: BookOpen, label: 'Knowledge Base', path: '/panel/knowledge-base' },
  { icon: Hash, label: 'Numbers', path: '/panel/numbers' },
  { icon: CalendarDays, label: 'Bookings', path: '/panel/bookings' },
  { icon: Activity, label: 'Live Monitor', path: '/panel/live' },
  { icon: Zap, label: 'Automation', path: '/panel/automation' },
  { icon: BarChart2, label: 'Analytics', path: '/panel/analytics' },
];

const BOTTOM_NAV = [
  { icon: Settings, label: 'Settings', path: '/panel/settings' },
  { icon: User, label: 'Profile', path: '/panel/profile' },
];

function NavBtn({ item, active }: { item: any; active: boolean }) {
  const [show, setShow] = useState(false);
  const router = useRouter();
  const Icon = item.icon;

  return (
    <div
      style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', margin: '1px 0' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        onClick={() => router.push(item.path)}
        style={{
          width: '36px', height: '36px',
          borderRadius: '8px', border: 'none',
          background: active ? '#f0f0f5' : 'transparent',
          color: active ? '#09090b' : '#9ca3af',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.12s',
        }}
        onMouseEnter={e => {
          if (!active) {
            e.currentTarget.style.background = '#f5f5f7';
            e.currentTarget.style.color = '#09090b';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }
        }}
      >
        <Icon size={17} strokeWidth={active ? 2 : 1.5} />
      </button>

      {show && (
        <div style={{
          position: 'absolute', left: '100%', top: '50%',
          transform: 'translateY(-50%)', marginLeft: '10px',
          background: '#09090b', color: '#ffffff',
          padding: '5px 10px', borderRadius: '6px',
          fontSize: '12px', fontWeight: 500,
          whiteSpace: 'nowrap', zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', right: '100%', top: '50%',
            transform: 'translateY(-50%)',
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderRight: '5px solid #09090b',
          }} />
          {item.label}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Auto-detect mode from current path
  const isVoicePath = ['/panel/voice-agents', '/panel/campaigns', 
    '/panel/knowledge-base', '/panel/numbers', 
    '/panel/bookings', '/panel/live', '/panel/automation'].some(p => pathname.startsWith(p));
  
  const [mode, setMode] = useState<'chat' | 'voice'>(isVoicePath ? 'voice' : 'chat');
  const navItems = mode === 'chat' ? CHAT_NAV : VOICE_NAV;

  // Sync mode state if pathname changes (e.g., navigating from elsewhere)
  useEffect(() => {
    if (isVoicePath) setMode('voice');
  }, [pathname, isVoicePath]);

  return (
    <div style={{
      width: '52px',
      background: '#ffffff',
      borderRight: '1px solid #e4e4e7',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '12px 0',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div
        onClick={() => router.push('/panel/dashboard')}
        style={{
          width: '30px', height: '30px',
          background: '#7c3aed', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '12px', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>Q</span>
      </div>

      {/* Product Switcher */}
      <div style={{
        width: '40px',
        background: '#f4f4f5',
        borderRadius: '10px',
        padding: '3px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        marginBottom: '12px',
      }}>
        {/* Chat mode button */}
        <div
          onClick={() => {
            setMode('chat');
            router.push('/panel/dashboard');
          }}
          title="Chat & Support"
          style={{
            width: '34px', height: '34px',
            borderRadius: '8px',
            background: mode === 'chat' ? '#ffffff' : 'transparent',
            boxShadow: mode === 'chat' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s',
            color: mode === 'chat' ? '#9ccbc0' : '#9ca3af',
          }}
        >
          <MessageSquare size={15} strokeWidth={mode === 'chat' ? 2 : 1.5} />
        </div>

        {/* Voice mode button */}
        <div
          onClick={() => {
            setMode('voice');
            router.push('/panel/voice-agents');
          }}
          title="Voice Agents"
          style={{
            width: '34px', height: '34px',
            borderRadius: '8px',
            background: mode === 'voice' ? '#ffffff' : 'transparent',
            boxShadow: mode === 'voice' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s',
            color: mode === 'voice' ? '#9ccbc0' : '#9ca3af',
          }}
        >
          <Mic size={15} strokeWidth={mode === 'voice' ? 2 : 1.5} />
        </div>
      </div>

      {/* Divider */}
      <div style={{
        width: '24px', height: '1px',
        background: '#e4e4e7', marginBottom: '8px',
      }} />

      {/* Nav Items */}
      {navItems.map(item => (
        <NavBtn
          key={item.path}
          item={item}
          active={pathname.startsWith(item.path)}
        />
      ))}

      <div style={{ flex: 1 }} />

      {/* Bottom Nav */}
      {BOTTOM_NAV.map(item => (
        <NavBtn
          key={item.path}
          item={item}
          active={pathname === item.path || pathname.startsWith(item.path)}
        />
      ))}
    </div>
  );
}
