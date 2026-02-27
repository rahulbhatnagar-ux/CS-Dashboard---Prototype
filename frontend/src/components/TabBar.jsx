import React from 'react';

export default function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0,
    }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding: '8px 16px', fontSize: 13, fontWeight: 500,
          background: active === t.key ? 'var(--bg-card)' : 'transparent',
          color: active === t.key ? 'var(--accent-blue)' : 'var(--text-muted)',
          borderBottom: active === t.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
          borderRadius: '8px 8px 0 0',
          transition: 'all 0.15s',
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
