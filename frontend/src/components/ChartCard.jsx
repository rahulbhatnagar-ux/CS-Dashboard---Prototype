import React from 'react';

export default function ChartCard({ title, subtitle, children, mock, style }) {
  return (
    <div className={mock ? 'mock-highlight' : ''} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px',
      display: 'flex', flexDirection: 'column', gap: 12,
      ...style,
    }}>
      {title && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
