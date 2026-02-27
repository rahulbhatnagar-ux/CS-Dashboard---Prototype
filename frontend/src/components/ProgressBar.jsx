import React from 'react';

export default function ProgressBar({ value, max = 100, color = 'var(--accent-blue)', height = 8, label }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height, background: 'var(--bg-primary)', borderRadius: height / 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height / 2, transition: 'width 0.5s' }} />
      </div>
      {label && <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 40, textAlign: 'right' }}>{label}</span>}
    </div>
  );
}
