import React from 'react';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../../components/MetricCard';
import ChartCard from '../../components/ChartCard';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import DataSourceLabel from '../../components/DataSourceLabel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundaryCard from '../../components/ErrorBoundaryCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, Clock, FileCheck, ExternalLink } from 'lucide-react';

const STATUS_COLORS = {
  Closed: 'var(--accent-green)', 'Waiting on User': 'var(--accent-amber)', 'Escalated to L2': 'var(--accent-red)',
  Open: 'var(--accent-blue)', 'In Progress': 'var(--accent-purple)',
};

export default function EscalationAnalysis() {
  const { data: statusData, loading: l1, error: e1, refetch: r1 } = useApi('/api/intelligence/escalation-stats');
  const { data: catData, loading: l2, error: e2, refetch: r2 } = useApi('/api/intelligence/escalation-by-category');
  const { data: jiraData } = useApi('/api/operations/jira-linked');

  const loading = l1 || l2;
  const error = e1 || e2;

  const statuses = (statusData?.records || []).map(r => ({
    name: r.Status, value: r.total,
  }));
  const totalCases = statuses.reduce((s, r) => s + r.value, 0);
  const escalated = statuses.find(s => s.name === 'Escalated to L2')?.value || 0;
  const escRate = totalCases > 0 ? ((escalated / totalCases) * 100).toFixed(1) : 0;

  const categories = (catData?.records || []).map(r => ({
    name: r.Ticket_Category__c || 'Unknown', value: r.total,
  }));

  const jiraLinked = jiraData?.records || [];
  const jiraCount = jiraLinked.reduce((s, r) => s + (r.total || 0), 0);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">Escalation Analysis</div>
        {statusData && <DataSourceLabel source={statusData._source} updated={statusData._updated} />}
      </div>

      {loading && <LoadingSpinner message="Loading escalation data from Salesforce..." />}
      {error && <ErrorBoundaryCard error={error} onRetry={() => { r1(); r2(); }} />}

      {statusData && (
        <>
          <div className="grid-4">
            <MetricCard label="Total Escalations" value={escalated.toLocaleString()} icon={AlertTriangle} color="red" subtitle="Last 90 days" />
            <MetricCard label="Escalation Rate" value={`${escRate}%`} icon={TrendingUp} color="amber" subtitle="Of total cases" />
            <MetricCard label="Total Cases (90d)" value={totalCases.toLocaleString()} icon={FileCheck} color="blue" />
            <MetricCard label="Jira-Linked" value={jiraCount.toLocaleString()} icon={ExternalLink} color="purple" subtitle="7.9% of cases" />
          </div>

          <div className="grid-2">
            <ChartCard title="Case Status Distribution" subtitle="Last 90 days — Live from Salesforce">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statuses} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
                  <XAxis type="number" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg, #1C1835)', border: '1px solid var(--chart-tooltip-border, #3D3568)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {statuses.map((s, i) => <Cell key={i} fill={STATUS_COLORS[s.name] || 'var(--chart-tick, #9690B0)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Escalation by Category" subtitle="Ticket_Category__c for L2 escalations">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
                  <XAxis type="number" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={160} tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg, #1C1835)', border: '1px solid var(--chart-tooltip-border, #3D3568)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="var(--accent-red)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Jira-Linked Escalations */}
          <ChartCard title="Jira-Linked Escalations" subtitle={`${jiraCount.toLocaleString()} CSE tickets linked via JIRA_Key__c`}>
            {jiraLinked.length > 0 ? (
              <DataTable
                columns={[
                  { key: 'Ticket_Category__c', label: 'Category' },
                  { key: 'total', label: 'Jira-Linked Cases', align: 'right', mono: true },
                  {
                    key: 'pct', label: '% of Total', align: 'right',
                    render: (_, row) => {
                      const pct = jiraCount > 0 ? ((row.total / jiraCount) * 100).toFixed(1) : 0;
                      return <span style={{ fontFamily: 'var(--font-mono)' }}>{pct}%</span>;
                    },
                  },
                ]}
                data={jiraLinked.slice(0, 10)}
                pageSize={10}
              />
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                <ExternalLink size={16} style={{ marginBottom: 8, opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
                <div>JIRA_Key__c populated on 7.9% of cases. Link SF to Jira CSE for end-to-end escalation tracking.</div>
              </div>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}
