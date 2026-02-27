import React from 'react';

const styles = {
  up: { bg: 'rgba(255,71,87,0.15)', color: 'var(--accent-red)' },
  down: { bg: 'rgba(0,208,156,0.15)', color: 'var(--accent-green)' },
  stable: { bg: 'rgba(150,144,176,0.15)', color: 'var(--text-muted)' },
  success: { bg: 'rgba(0,208,156,0.15)', color: 'var(--accent-green)' },
  warning: { bg: 'rgba(255,176,32,0.15)', color: 'var(--accent-amber)' },
  error: { bg: 'rgba(255,71,87,0.15)', color: 'var(--accent-red)' },
  info: { bg: 'rgba(123,97,255,0.15)', color: 'var(--accent-blue)' },
  purple: { bg: 'rgba(167,139,250,0.15)', color: 'var(--accent-purple)' },
};

export default function Badge({ variant = 'info', children }) {
  const s = styles[variant] || styles.info;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, fontFamily: 'var(--font-mono)',
    }}>
      {children}
    </span>
  );
}
