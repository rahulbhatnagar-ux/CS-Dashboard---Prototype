import React from 'react';
import { Database } from 'lucide-react';

export default function PlaceholderPanel({ title = 'BigQuery Connection Pending', description, icon: Icon = Database }) {
  return (
    <div style={{
      border: '2px dashed rgba(123,97,255,0.3)', borderRadius: 'var(--radius)',
      background: 'rgba(123,97,255,0.05)', padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'pulse 3s ease-in-out infinite',
    }}>
      <Icon size={20} style={{ color: 'var(--accent-blue)', opacity: 0.7 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {description || 'This section requires BigQuery data. Currently showing mock data.'}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }`}</style>
    </div>
  );
}
