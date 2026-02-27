import React from 'react';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../../components/MetricCard';
import ChartCard from '../../components/ChartCard';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import ProgressBar from '../../components/ProgressBar';
import AlertBanner from '../../components/AlertBanner';
import DataSourceLabel from '../../components/DataSourceLabel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundaryCard from '../../components/ErrorBoundaryCard';
import BQPendingCard from '../../components/BQPendingCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BookOpen, Users, Shield, Fingerprint, Database } from 'lucide-react';

export default function HCDeflection() {
  const { data, loading, error, refetch } = useApi('/api/intelligence/hc-deflection');
  const { data: kbData } = useApi('/api/intelligence/kb-metrics');

  const isMock = data?._source === 'mock';
  const isExcel = data?._source === 'excel' || data?._source === 'excel+mock';

  const hcVisits = data?.hcVisits || {};
  const totalVisits = (hcVisits.app || 0) + (hcVisits.web || 0);
  const entryData = [
    { name: 'App', value: hcVisits.app || 0 },
    { name: 'Web', value: hcVisits.web || 0 },
  ];
  const topArticles = data?.topArticles || [];
  const scoreDist = data?.scoreDistribution || [];

  // KB data from separate endpoint
  const kbArticles = kbData?.topArticles || [];
  const kbScoreDist = kbData?.scoreDistribution || [];

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">Help Center Deflection Analysis</div>
        {data && <DataSourceLabel source={data._source} updated={data._updated} processedAt={data._processedAt} />}
      </div>

      {loading && <LoadingSpinner message="Loading deflection data..." />}
      {error && <ErrorBoundaryCard error={error} onRetry={refetch} />}

      {data && (
        <>
          {isExcel && (
            <AlertBanner type="info" dismissible>
              Data from {data._sourceFile || 'Excel export'}: {(data.bqRecords || 0).toLocaleString()} BQ records processed.
              Identity match rate: {data.identityMatch || 0}%.
            </AlertBanner>
          )}

          <div className="grid-4">
            <MetricCard label="Total HC Visits" value={totalVisits.toLocaleString()} icon={BookOpen} color="blue" mock={isMock} />
            <MetricCard label="Unique Users" value={(hcVisits.uniqueUsers || 0).toLocaleString()} icon={Users} color="purple" mock={isMock} />
            <MetricCard label="Containment Rate" value={`${data?.containmentRate || 0}%`} icon={Shield} color="green" mock={isMock} />
            <MetricCard label="Identity Match" value={`${data?.identityMatch || 0}%`} icon={Fingerprint} color="teal" mock={isMock} />
          </div>

          <div className="grid-2">
            <ChartCard title="Entry Point" subtitle="App vs Web" mock={isMock}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={entryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`} labelLine={false} style={{ fontSize: 11 }}>
                    <Cell fill="var(--accent-blue)" />
                    <Cell fill="var(--accent-purple)" />
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg, #1C1835)', border: '1px solid var(--chart-tooltip-border, #3D3568)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Deflection Funnel" mock={isMock}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12 }}>
                {[
                  { label: 'HC Visit', value: totalVisits, pct: 100 },
                  { label: 'Article View', value: Math.round(totalVisits * 0.85), pct: 85 },
                  { label: 'Resolved (No Ticket)', value: Math.round(totalVisits * (data?.containmentRate || 78) / 100), pct: data?.containmentRate || 78 },
                  { label: 'Escalated (Ticket)', value: Math.round(totalVisits * (100 - (data?.containmentRate || 78)) / 100), pct: 100 - (data?.containmentRate || 78) },
                ].map((step, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{step.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{step.value.toLocaleString()}</span>
                    </div>
                    <ProgressBar value={step.pct} color={i < 3 ? 'var(--accent-blue)' : 'var(--accent-red)'} />
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid-2">
            <ChartCard title="Top Articles by Views" mock={isMock}>
              {topArticles.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topArticles.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
                    <XAxis type="number" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 11 }} />
                    <YAxis dataKey="title" type="category" width={200} tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg, #1C1835)', border: '1px solid var(--chart-tooltip-border, #3D3568)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="views" fill="var(--accent-green)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <BQPendingCard
                  title="Article View Data Pending"
                  description="Top articles by views requires BQ page analytics or KC article view tracking."
                  features={['Page view counts per article', 'Unique visitor tracking', 'Time-on-page metrics']}
                />
              )}
            </ChartCard>
            <ChartCard title="KB Quality Score Distribution" subtitle={`${kbData?.totalArticles || data?.scoredArticles || 0} articles scored, avg ${kbData?.avgScore || data?.avgScore || 0}`} mock={isMock}>
              {(kbScoreDist.length > 0 || scoreDist.length > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kbScoreDist.length > 0 ? kbScoreDist : scoreDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
                    <XAxis dataKey="range" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg, #1C1835)', border: '1px solid var(--chart-tooltip-border, #3D3568)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {(kbScoreDist.length > 0 ? kbScoreDist : scoreDist).map((d, i) => <Cell key={i} fill={i < 2 ? 'var(--accent-red)' : i === 2 ? 'var(--accent-amber)' : 'var(--accent-green)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No score distribution data available.
                </div>
              )}
            </ChartCard>
          </div>

          <ChartCard title="Articles with High Views + Low Score" subtitle="Prioritize for content improvement" mock={isMock}>
            {topArticles.filter(a => a.score < 7).length > 0 ? (
              <DataTable
                columns={[
                  { key: 'title', label: 'Article' },
                  { key: 'views', label: 'Views', align: 'right', mono: true },
                  {
                    key: 'score', label: 'Score', align: 'center',
                    render: (v) => <Badge variant={v >= 7 ? 'success' : v >= 5 ? 'warning' : 'error'}>{v.toFixed(1)}</Badge>,
                  },
                ]}
                data={topArticles.filter(a => a.score < 7).sort((a, b) => b.views - a.views)}
                pageSize={10}
              />
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No low-scoring articles with high views found. Score data may need KB Analytics integration.
              </div>
            )}
          </ChartCard>

          {/* Channel Cascade from BQ */}
          {data?.channelCascade && Object.keys(data.channelCascade).length > 0 && (
            <ChartCard title="Post-HC Channel Cascade" subtitle="Where users go after visiting Help Center">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                {Object.entries(data.channelCascade).sort((a, b) => b[1] - a[1]).map(([channel, count]) => (
                  <div key={channel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{channel}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{count.toLocaleString()}</span>
                    </div>
                    <ProgressBar value={count} max={Math.max(...Object.values(data.channelCascade))} color="var(--accent-blue)" />
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}
