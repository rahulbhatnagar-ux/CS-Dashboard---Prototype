import React from 'react';
import { Loader } from 'lucide-react';

export default function LoadingSpinner({ message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 12 }}>
      <Loader size={24} style={{ color: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{message || 'Loading...'}</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
