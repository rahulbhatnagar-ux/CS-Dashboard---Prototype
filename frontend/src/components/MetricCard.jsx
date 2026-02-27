import React from 'react';

const colors = {
  blue: 'var(--accent-blue)',
  green: 'var(--accent-green)',
  red: 'var(--accent-red)',
  amber: 'var(--accent-amber)',
  purple: 'var(--accent-purple)',
  teal: 'var(--accent-teal)',
  pink: 'var(--accent-pink)',
};

export default function MetricCard({ label, value, subtitle, icon: Icon, color = 'blue', trend, mock }) {
  const accentColor = colors[color] || colors.blue;
  return (
    <div className={mock ? 'mock-highlight' : ''} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>{label}</span>
        {Icon && <Icon size={18} style={{ color: accentColor, opacity: 0.7 }} />}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: accentColor }}>
        {value}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {subtitle && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{subtitle}</span>}
        {trend && (
          <span style={{
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
            color: trend.direction === 'up' ? 'var(--accent-red)' : trend.direction === 'down' ? 'var(--accent-green)' : 'var(--text-muted)',
          }}>
            {trend.direction === 'up' ? '\u2191' : trend.direction === 'down' ? '\u2193' : '\u2192'} {trend.value}% {trend.label || ''}
          </span>
        )}
      </div>
    </div>
  );
}
