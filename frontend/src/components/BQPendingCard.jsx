import React from 'react';
import { Plug, Database } from 'lucide-react';

export default function BQPendingCard({ title, description, features }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px dashed var(--border)',
      borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <Database size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        <Plug size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
        {title || 'BigQuery Integration Pending'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
        {description || 'This section requires BigQuery connection. Data will be available once BQ integration is configured.'}
      </div>
      {features && features.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'left', maxWidth: 300, margin: '0 auto' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Will include:</div>
          <ul style={{ paddingLeft: 16, margin: 0, lineHeight: 1.8 }}>
            {features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
