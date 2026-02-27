import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

const config = {
  warning: { bg: 'rgba(255,176,32,0.1)', border: 'rgba(255,176,32,0.3)', icon: AlertTriangle, color: 'var(--accent-amber)' },
  error: { bg: 'rgba(255,71,87,0.1)', border: 'rgba(255,71,87,0.3)', icon: XCircle, color: 'var(--accent-red)' },
  info: { bg: 'rgba(123,97,255,0.1)', border: 'rgba(123,97,255,0.3)', icon: Info, color: 'var(--accent-blue)' },
  success: { bg: 'rgba(0,208,156,0.1)', border: 'rgba(0,208,156,0.3)', icon: CheckCircle, color: 'var(--accent-green)' },
};

export default function AlertBanner({ type = 'info', children, dismissible }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const c = config[type];
  const Icon = c.icon;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--radius)',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
    }}>
      <Icon size={16} style={{ color: c.color, flexShrink: 0 }} />
      <div style={{ flex: 1, color: c.color }}>{children}</div>
      {dismissible && (
        <button onClick={() => setDismissed(true)} style={{ background: 'none', padding: 4, color: c.color }}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
