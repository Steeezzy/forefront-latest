'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Bot, GitBranch,
  Users, Phone, Megaphone, Hash, Building2,
  BarChart2, Puzzle, Settings, User
} from 'lucide-react';

const NAV = [
  { icon: LayoutDashboard, label: 'Home', path: '/panel/dashboard' },
  { icon: Inbox, label: 'Inbox', path: '/panel/inbox' },
  { icon: Bot, label: 'Chatbot', path: '/panel/chatbot' },
  { icon: GitBranch, label: 'Flows', path: '/panel/flows' },
  { icon: Users, label: 'Customers', path: '/panel/customers' },
  { icon: Phone, label: 'Voice Agents', path: '/panel/voice-agents' },
  { icon: Megaphone, label: 'Campaigns', path: '/panel/campaigns' },
  { icon: Hash, label: 'Numbers', path: '/panel/numbers' },
  { icon: Building2, label: 'Workspace', path: '/panel/workspace' },
  { icon: BarChart2, label: 'Analytics', path: '/panel/analytics' },
  { icon: Puzzle, label: 'Integrations', path: '/panel/integrations' },
];

const BOTTOM = [
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
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: 'none',
          background: active ? '#f0f0f5' : 'transparent',
          color: active ? '#09090b' : '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.12s',
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

      {/* Tooltip */}
      {show && (
        <div style={{
          position: 'absolute',
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '10px',
          background: '#09090b',
          color: '#ffffff',
          padding: '5px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          pointerEvents: 'none',
        }}>
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            right: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
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

  return (
    <div style={{
      width: '52px',
      background: '#ffffff',
      borderRight: '1px solid #e4e4e7',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 0',
      zIndex: 100,
      overflowX: 'visible',
    }}>
      {/* Logo */}
      <div style={{
        width: '30px',
        height: '30px',
        background: '#6366f1',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '18px',
        flexShrink: 0,
      }}>
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>Q</span>
      </div>

      {/* Main nav */}
      {NAV.map(item => (
        <NavBtn
          key={item.path}
          item={item}
          active={pathname.startsWith(item.path)}
        />
      ))}

      <div style={{ flex: 1 }} />

      {/* Bottom nav */}
      {BOTTOM.map(item => (
        <NavBtn
          key={item.path}
          item={item}
          active={pathname.startsWith(item.path)}
        />
      ))}
    </div>
  );
}
