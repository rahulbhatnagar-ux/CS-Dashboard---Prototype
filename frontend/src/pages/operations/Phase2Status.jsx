import React from 'react';
import ChartCard from '../../components/ChartCard';
import Badge from '../../components/Badge';
import DataTable from '../../components/DataTable';
import ProgressBar from '../../components/ProgressBar';
import { ExternalLink } from 'lucide-react';

const workstreams = [
  { workstream: 'Reports', status: 'In Progress', current: '16/33 metrics available in SF, 5 custom, 12 from BQ', nextSteps: 'BQ data validation in progress' },
  { workstream: 'Automation Enhancements', status: 'In Progress', current: 'Enhance L1 automation, email automation', nextSteps: 'Awaiting prioritisation' },
  { workstream: 'Agent Experience Foundations', status: 'Planned', current: 'Improve agent context, reduce investigation time', nextSteps: 'Requirements gathering' },
  { workstream: 'Monitoring & RCA Intelligence', status: 'Planned', current: 'Automated Slack dashboards, surge alerts', nextSteps: '\u2014' },
  { workstream: 'Quality Assurance Automation', status: 'Planned', current: 'LLM-driven scoring, manual routing', nextSteps: '\u2014' },
  { workstream: 'WhatsApp Service Integration', status: 'In Progress', current: 'Vendor comparison done (360 SMS, WatBox, Mogli)', nextSteps: 'Awaiting final vendor selection' },
];

function statusVariant(s) {
  if (s === 'In Progress') return 'info';
  if (s === 'Planned') return 'warning';
  if (s === 'Done') return 'success';
  return 'info';
}

export default function Phase2Status() {
  const inProgress = workstreams.filter(w => w.status === 'In Progress').length;
  const planned = workstreams.filter(w => w.status === 'Planned').length;

  return (
    <div className="page">
      <div className="page-title">Phase 2 — CS Transformation Status</div>

      <div style={{
        background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.2)',
        borderRadius: 'var(--radius)', padding: '16px 20px', fontSize: 13, color: 'var(--text)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <span style={{ fontWeight: 600 }}>CS Transformation Project: Phase 2</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 12 }}>
            {inProgress} In Progress \u00B7 {planned} Planned
          </span>
        </div>
        <a href="#" style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <ExternalLink size={12} /> Phase 2 High Level Document
        </a>
      </div>

      <ChartCard title="Reports Breakdown" subtitle="33 metric requirements provided by CS">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '8px 0' }}>
          {[
            { label: 'Available in SF', value: 16, total: 33, color: 'var(--accent-green)' },
            { label: 'Custom from SF', value: 5, total: 33, color: 'var(--accent-blue)' },
            { label: 'From BQ (validating)', value: 12, total: 33, color: 'var(--accent-amber)' },
            { label: 'Custom in progress', value: 2, total: 33, color: 'var(--accent-purple)' },
          ].map((item, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.value}/{item.total}</span>
              </div>
              <ProgressBar value={item.value} max={item.total} color={item.color} height={6} />
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Workstream Status" subtitle="Phase 2 transformation workstreams">
        <DataTable
          columns={[
            { key: 'workstream', label: 'Workstream' },
            {
              key: 'status', label: 'Status', align: 'center',
              render: (v) => (
                <Badge variant={statusVariant(v)}>
                  {v}
                </Badge>
              ),
            },
            { key: 'current', label: 'Current State' },
            { key: 'nextSteps', label: 'Next Steps' },
          ]}
          data={workstreams}
          pageSize={10}
          mock
        />
      </ChartCard>
    </div>
  );
}
