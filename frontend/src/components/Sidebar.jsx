import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3, Shield, Brain, TrendingUp, MessageSquare, Star,
  Bot, Mail, Search, BookOpen, AlertTriangle, Users,
  FileCheck, Wrench, ChevronLeft, ChevronRight, LayoutDashboard,
  Bug, Library,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import useMediaQuery from '../hooks/useMediaQuery';

const sections = [
  {
    title: 'OPERATIONS',
    icon: BarChart3,
    items: [
      { to: '/', label: 'CO Dashboard', icon: LayoutDashboard },
      { to: '/sla', label: 'SLA Analysis', icon: Shield },
      { to: '/cti-board', label: 'CTI Board', icon: Bug },
    ],
  },
  {
    title: 'INTELLIGENCE',
    icon: Brain,
    items: [
      { to: '/csat', label: 'CSAT Analysis', icon: Star },
      { to: '/channel-mix', label: 'Channel Effort & FCR', icon: TrendingUp },
      { to: '/product-feedback', label: 'Product Feedback', icon: MessageSquare },
      { to: '/chatbot', label: 'Chatbot Deep Dive', icon: Bot },
      { to: '/email', label: 'Email Deep Dive', icon: Mail },
      { to: '/search', label: 'Search Utterances', icon: Search },
      { to: '/kb-health', label: 'KB Health', icon: Library },
      { to: '/hc-deflection', label: 'HC Deflection', icon: BookOpen },
      { to: '/escalation', label: 'Escalation Analysis', icon: AlertTriangle },
    ],
  },
  {
    title: 'AGENT WORKSPACE',
    icon: Wrench,
    items: [
      { to: '/customer-360', label: 'Customer 360', icon: Users },
      { to: '/cse-resolver', label: 'CSE Ticket Resolver', icon: FileCheck },
      { to: '/cti-resolver', label: 'CTI Ticket Resolver', icon: Wrench },
    ],
  },
];

export default function Sidebar() {
  const isNarrow = useMediaQuery('(max-width: 1024px)');
  const [manualCollapsed, setManualCollapsed] = useState(false);

  // Auto-collapse on narrow viewports, or manual toggle
  const collapsed = isNarrow || manualCollapsed;
  const w = collapsed ? 56 : 240;

  return (
    <nav style={{
      width: w, minWidth: w, height: '100vh', background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s', overflow: 'hidden', position: 'sticky', top: 0,
    }}>
      <div style={{
        padding: collapsed ? '16px 12px' : '16px 20px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)', minHeight: 56,
      }}>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent-blue)', whiteSpace: 'nowrap' }}>
            Pluang CS
          </span>
        )}
        {!isNarrow && (
          <button onClick={() => setManualCollapsed(c => !c)} style={{
            background: 'none', padding: 4, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
          }}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {sections.map(sec => (
          <div key={sec.title} style={{ marginBottom: 8 }}>
            {!collapsed && (
              <div style={{
                padding: '8px 20px 4px', fontSize: 10, fontWeight: 700,
                color: 'var(--text-muted)', letterSpacing: '0.08em',
              }}>
                {sec.title}
              </div>
            )}
            {collapsed && (
              <div style={{ padding: '8px 0 4px', display: 'flex', justifyContent: 'center' }}>
                <sec.icon size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            )}
            {sec.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '8px 0' : '8px 20px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(123,97,255,0.08)' : 'transparent',
                  borderRight: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none', transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                })}
              >
                <item.icon size={collapsed ? 18 : 16} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
      <ThemeToggle collapsed={collapsed} />
    </nav>
  );
}
