import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBoundaryCard({ error, onRetry, title }) {
  return (
    <div style={{
      background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)',
      borderRadius: 'var(--radius)', padding: '20px', textAlign: 'center',
    }}>
      <AlertTriangle size={24} style={{ color: 'var(--accent-red)', marginBottom: 8 }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-red)', marginBottom: 4 }}>
        {title || 'Failed to load data'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
        {error || 'An unexpected error occurred.'}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}
