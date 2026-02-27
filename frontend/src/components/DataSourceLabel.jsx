import React from 'react';
import { Database, FileSpreadsheet, HelpCircle, Clock } from 'lucide-react';

const sourceConfig = {
  salesforce: { label: 'Salesforce Live', icon: Database, color: '#7B61FF' },
  excel: { label: 'Excel Export', icon: FileSpreadsheet, color: '#00D09C' },
  'excel+mock': { label: 'Excel + Mock', icon: FileSpreadsheet, color: '#FFB020' },
  jira: { label: 'Jira Live', icon: Database, color: '#7B61FF' },
  mock: { label: 'Mock Data', icon: HelpCircle, color: '#FF4757' },
  'mock-fallback': { label: 'Mock Fallback', icon: HelpCircle, color: '#FF4757' },
};

export default function DataSourceLabel({ source, updated, processedAt, style }) {
  const cfg = sourceConfig[source] || sourceConfig.mock;
  const Icon = cfg.icon;
  const timeStr = updated
    ? new Date(updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  const dateStr = processedAt
    ? new Date(processedAt).toLocaleDateString()
    : null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, color: 'var(--text-muted)', padding: '2px 0',
      ...style,
    }}>
      <Icon size={10} style={{ color: cfg.color }} />
      <span>Source: {cfg.label}</span>
      {timeStr && (
        <>
          <span style={{ opacity: 0.5 }}>|</span>
          <Clock size={9} style={{ opacity: 0.5 }} />
          <span>{timeStr}</span>
        </>
      )}
      {dateStr && !timeStr && (
        <>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>Processed: {dateStr}</span>
        </>
      )}
    </div>
  );
}
