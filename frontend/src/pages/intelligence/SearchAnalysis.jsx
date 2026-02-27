import React from 'react';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../../components/MetricCard';
import ChartCard from '../../components/ChartCard';
import AlertBanner from '../../components/AlertBanner';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import DataSourceLabel from '../../components/DataSourceLabel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundaryCard from '../../components/ErrorBoundaryCard';
import BQPendingCard from '../../components/BQPendingCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Search, AlertTriangle, Smartphone, Globe, ShieldAlert } from 'lucide-react';

export default function SearchAnalysis() {
  const { data, loading, error, refetch } = useApi('/api/intelligence/search-stats');

  const channels = data?.channels || {};
  const channelData = Object.entries(channels).map(([k, v]) => ({ name: k, value: v }));
  const terms = data?.topSearchTerms || [];
  const isMock = data?._source === 'mock';
  const isExcel = data?._source === 'excel';

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">Search Utterances Analysis</div>
        {data && <DataSourceLabel source={data._source} updated={data._updated} processedAt={data._processedAt} />}
      </div>

      {loading && <LoadingSpinner message="Loading search data..." />}
      {error && <ErrorBoundaryCard error={error} onRetry={refetch} />}

      {data && (
        <>
          {isExcel && (
            <AlertBanner type="info" dismissible>
              Data from {data._sourceFile || 'Excel export'}: {(data.totalSearches || 0).toLocaleString()} SF searches + {(data.ragQueries || 0).toLocaleString()} RAG queries.
            </AlertBanner>
          )}

          <div className="grid-4">
            <MetricCard label="Total Searches" value={(data?.totalSearches || 0).toLocaleString()} icon={Search} color="blue" mock={isMock} />
            <MetricCard label="Zero-Result Rate" value={`${data?.zeroResultRate || 0}%`} icon={AlertTriangle} color="red" mock={isMock} />
            <MetricCard label="Internal App" value={(channels['Internal App'] || 0).toLocaleString()} icon={Smartphone} color="purple" mock={isMock} />
            <MetricCard label="Public KB" value={(channels['Public Knowledge Base'] || channels['Public KB'] || 0).toLocaleString()} icon={Globe} color="teal" mock={isMock} />
          </div>

          <AlertBanner type="error">
            {data?.zeroResultRate || 0}% of searches returned no results — users search by action while KB is organized by product taxonomy
          </AlertBanner>

          {/* PII Warning */}
          {data?.piiSearches?.count > 0 && (
            <AlertBanner type="warning">
              <ShieldAlert size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {data.piiSearches.count.toLocaleString()} searches ({data.piiSearches.pct}%) contain PII patterns (emails, phone numbers, ticket numbers) — mostly from {Object.keys(data.piiSearches.byChannel || {})[0] || 'Internal App'}
            </AlertBanner>
          )}

          <div className="grid-2">
            <ChartCard title="Search Channel Split" mock={isMock}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 11 }}>
                    <Cell fill="var(--accent-purple)" />
                    <Cell fill="var(--accent-teal)" />
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg, #1C1835)', border: '1px solid var(--chart-tooltip-border, #3D3568)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Top Search Terms" subtitle={`Top ${terms.length} by frequency`} mock={isMock}>
              <ResponsiveContainer width="100%" height={Math.max(220, terms.slice(0, 12).length * 28)}>
                <BarChart data={terms.slice(0, 12)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
                  <XAxis type="number" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 11 }} />
                  <YAxis dataKey="term" type="category" width={130} tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg, #1C1835)', border: '1px solid var(--chart-tooltip-border, #3D3568)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Search Terms Detail" subtitle="All search terms with click-through data" mock={isMock}>
            <DataTable
              columns={[
                { key: 'term', label: 'Search Term' },
                { key: 'termEN', label: 'English', render: v => v && v !== 'Loading...' ? v : <span style={{ color: 'var(--text-muted)' }}>—</span> },
                { key: 'count', label: 'Searches', align: 'right', mono: true },
                { key: 'clickRate', label: 'Click Rate', align: 'right', mono: true, render: v => v !== undefined ? `${v}%` : '—' },
                {
                  key: 'hasArticle', label: 'Has Article', align: 'center',
                  render: (v) => <Badge variant={v ? 'success' : 'error'}>{v ? 'Yes' : 'No'}</Badge>,
                },
              ]}
              data={terms}
              pageSize={15}
            />
          </ChartCard>

          {/* RAG Feedback Section */}
          {data?.ragFeedback && (
            <ChartCard title="RAG Search Performance" subtitle={`${(data?.ragQueries || 0).toLocaleString()} RAG queries processed`}>
              <div style={{ display: 'flex', gap: 24, padding: '12px 0', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', padding: '16px 24px', background: 'rgba(255,71,87,0.06)', borderRadius: 8, border: '1px solid rgba(255,71,87,0.15)' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-red)' }}>
                    {data.ragFeedback.feedbackRate}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Feedback Collection Rate</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, flex: 1 }}>
                  <strong style={{ color: 'var(--accent-red)' }}>Critical:</strong> Out of {data.ragFeedback.totalResponses.toLocaleString()} RAG responses,
                  only {data.ragFeedback.feedbackCollected} collected user feedback.
                  This is a broken feedback loop — there is no way to measure RAG answer quality.
                  <br /><br />
                  <strong>Recommendation:</strong> Implement thumbs up/down feedback on RAG responses to enable quality measurement and continuous improvement.
                </div>
              </div>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}
