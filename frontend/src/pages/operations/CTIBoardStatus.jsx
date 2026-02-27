import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../../components/MetricCard';
import ChartCard from '../../components/ChartCard';
import Badge from '../../components/Badge';
import DataSourceLabel from '../../components/DataSourceLabel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundaryCard from '../../components/ErrorBoundaryCard';
import AlertBanner from '../../components/AlertBanner';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import {
  Bug, RefreshCw, Clock, AlertTriangle, Zap, Timer, ChevronDown, ChevronRight,
  ExternalLink, Lightbulb,
} from 'lucide-react';
import { tooltipStyle, tickStyle, gridStroke } from '../../utils/chartConfig';

/* ── Constants ── */

const JIRA_BASE = 'https://pgb-jira.atlassian.net/browse/';

const CATEGORY_COLORS = {
  'KYC/Verification': { bg: 'rgba(255,176,32,0.15)', color: 'var(--accent-amber)' },
  'Transfer/Crypto': { bg: 'rgba(167,139,250,0.15)', color: 'var(--accent-purple)' },
  'Pluang Plus': { bg: 'rgba(123,97,255,0.15)', color: 'var(--accent-blue)' },
  Withdrawal: { bg: 'rgba(255,71,87,0.15)', color: 'var(--accent-red)' },
  Reporting: { bg: 'rgba(45,212,191,0.15)', color: 'var(--accent-teal)' },
  'Account/Auth': { bg: 'rgba(255,176,32,0.15)', color: '#D99A00' },
  'Account Reactivation': { bg: 'rgba(255,107,107,0.15)', color: '#FF6B6B' },
  'App/Portfolio': { bg: 'rgba(150,144,176,0.15)', color: 'var(--text-muted)' },
  'Email/Communication': { bg: 'rgba(150,144,176,0.15)', color: 'var(--text-muted)' },
  Other: { bg: 'rgba(150,144,176,0.1)', color: 'var(--text-muted)' },
};

const BAR_COLORS = {
  'KYC/Verification': 'var(--accent-amber)',
  'Transfer/Crypto': 'var(--accent-purple)',
  'Pluang Plus': 'var(--accent-blue)',
  Reporting: 'var(--accent-teal)',
  Withdrawal: 'var(--accent-red)',
  'Account Reactivation': '#FF6B6B',
  'App/Portfolio': 'var(--chart-tick, #9690B0)',
  'Account/Auth': '#D99A00',
  'Email/Communication': 'var(--chart-tick, #9690B0)',
  Other: 'var(--text-muted)',
};

/* ── Helpers ── */

function CategoryTag({ category }) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 6,
      fontSize: 11, fontWeight: 600, background: c.bg, color: c.color,
      whiteSpace: 'nowrap',
    }}>
      {category}
    </span>
  );
}

function formatPriority(p) {
  if (!p) return 'Normal';
  if (p.includes('[P0]') || p.includes('Universe Ends')) return 'P0';
  if (p.includes('[P1]')) return 'P1';
  return p;
}

function isP0(p) {
  return p && (p.includes('[P0]') || p.includes('Universe Ends'));
}

function agingColor(days) {
  if (days <= 2) return 'success';
  if (days <= 7) return 'warning';
  return 'error';
}

function agingTextColor(days) {
  if (days <= 2) return 'var(--accent-green)';
  if (days <= 7) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

function formatResTime(hours) {
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}


/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

export default function CTIBoardStatus() {
  const { data, loading, error, refetch } = useApi('/api/cti-board');
  const [resolvedOpen, setResolvedOpen] = useState(false);
  const [filter, setFilter] = useState({ category: 'all', status: 'all', assignee: 'all' });
  const [search, setSearch] = useState('');

  const active = data?.activeTickets || [];
  const resolved = data?.recentlyResolved || [];
  const analytics = data?.analytics || {};
  const insights = analytics.insights || [];

  /* ── Derived metrics ── */
  const p0Count = active.filter(t => isP0(t.priority)).length;
  const oldestOpen = active.length > 0 ? Math.max(...active.map(t => t.ageDays)) : 0;
  const statusCounts = {};
  active.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const currentWeek = analytics.weeklyTrend?.[analytics.weeklyTrend.length - 1];
  const resStats = analytics.resolutionStats || {};

  /* ── Filters ── */
  const categories = [...new Set(active.map(t => t.category))].sort();
  const statuses = [...new Set(active.map(t => t.status))].sort();
  const assignees = [...new Set(active.map(t => t.assignee))].sort();

  const filtered = active.filter(t => {
    if (filter.category !== 'all' && t.category !== filter.category) return false;
    if (filter.status !== 'all' && t.status !== filter.status) return false;
    if (filter.assignee !== 'all' && t.assignee !== filter.assignee) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.key.toLowerCase().includes(q) && !t.summary.toLowerCase().includes(q) && !t.assignee.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selectStyle = {
    padding: '5px 10px', fontSize: 12, borderRadius: 6,
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text)', cursor: 'pointer',
  };

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">CTI Board</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {data && <DataSourceLabel source="jira" updated={data._updated} />}
          <button className="btn-ghost" onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <AlertBanner type="info" dismissible>
        Live data from CTI Jira board &bull; Last refreshed: {data?._updated ? new Date(data._updated).toLocaleString() : 'loading...'}
      </AlertBanner>

      {loading && <LoadingSpinner message="Loading CTI board data..." />}
      {error && <ErrorBoundaryCard error={error} onRetry={refetch} />}

      {data && (
        <>
          {/* ════════════════════════════════════════════════════════════
              SECTION 1: Summary Cards
              ════════════════════════════════════════════════════════════ */}
          <div className="grid-5">
            <MetricCard
              label="Active Tickets"
              value={active.length}
              icon={Bug}
              color="blue"
              subtitle={Object.entries(statusCounts).map(([s, c]) => `${c} ${s}`).join(', ')}
            />
            <MetricCard
              label="Avg Resolution"
              value={`${(resStats.avgHours / 24).toFixed(1)}d`}
              icon={Clock}
              color="amber"
              subtitle={`Median ${(resStats.medianHours / 24).toFixed(1)}d, P90 ${(resStats.p90Hours / 24).toFixed(1)}d`}
            />
            <MetricCard
              label="P0 Tickets Active"
              value={p0Count}
              icon={AlertTriangle}
              color={p0Count > 0 ? 'red' : 'green'}
              subtitle={p0Count > 0 ? 'Requires immediate attention' : 'No critical tickets'}
            />
            <MetricCard
              label="Weekly Velocity"
              value={currentWeek ? `${currentWeek.created} / ${currentWeek.resolved}` : '—'}
              icon={Zap}
              color="teal"
              subtitle="Created / Resolved this week"
            />
            <MetricCard
              label="Oldest Open"
              value={`${oldestOpen}d`}
              icon={Timer}
              color={oldestOpen > 7 ? 'red' : oldestOpen > 3 ? 'amber' : 'green'}
              subtitle={active.find(t => t.ageDays === oldestOpen)?.key || '—'}
            />
          </div>

          {/* ════════════════════════════════════════════════════════════
              SECTION 2: Active Tickets Table
              ════════════════════════════════════════════════════════════ */}
          <ChartCard title="Active Tickets" subtitle={`${filtered.length} of ${active.length} tickets`}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tickets..."
                style={{ ...selectStyle, flex: 1, minWidth: 180 }}
              />
              <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))} style={selectStyle}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
                <option value="all">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filter.assignee} onChange={e => setFilter(f => ({ ...f, assignee: e.target.value }))} style={selectStyle}>
                <option value="all">All Assignees</option>
                {assignees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Key', 'Summary', 'Category', 'Assignee', 'Status', 'Priority', 'Age'].map(h => (
                      <th key={h} style={{
                        padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                        color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-primary)', textTransform: 'uppercase', letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr
                      key={t.key}
                      onClick={() => window.open(`${JIRA_BASE}${t.key}`, '_blank')}
                      style={{
                        cursor: 'pointer',
                        background: i % 2 ? 'var(--bg-stripe)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(123,97,255,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = i % 2 ? 'var(--bg-stripe)' : 'transparent'; }}
                    >
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-blue)' }}>
                          {t.key} <ExternalLink size={10} style={{ opacity: 0.5 }} />
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', maxWidth: 400 }}>
                        {t.summary}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                        <CategoryTag category={t.category} />
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                        {t.assignee}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                        <Badge variant={t.status === 'To Do' ? 'warning' : t.status === 'In Progress' ? 'info' : 'success'}>
                          {t.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                        {isP0(t.priority) ? (
                          <Badge variant="error">P0</Badge>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatPriority(t.priority)}</span>
                        )}
                      </td>
                      <td style={{
                        padding: '10px 12px', borderBottom: '1px solid var(--border)',
                        fontFamily: 'var(--font-mono)', fontWeight: 700,
                        color: agingTextColor(t.ageDays),
                      }}>
                        {t.ageDays}d
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No tickets match filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* ════════════════════════════════════════════════════════════
              SECTION 3: Analytics (2x2 grid)
              ════════════════════════════════════════════════════════════ */}
          <div className="grid-2">
            {/* 3a: Category Breakdown */}
            <ChartCard title="Category Breakdown" subtitle="All-time CTI ticket distribution">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.categoryBreakdown || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis type="number" tick={tickStyle} />
                  <YAxis dataKey="category" type="category" width={130} tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {(analytics.categoryBreakdown || []).map((c, i) => (
                      <Cell key={i} fill={BAR_COLORS[c.category] || 'var(--text-muted)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 3b: Weekly Trend */}
            <ChartCard title="Weekly Trend" subtitle="Tickets created vs resolved per week">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analytics.weeklyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="week" tick={tickStyle} />
                  <YAxis tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="created" name="Created" stroke="var(--accent-blue)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="resolved" name="Resolved" stroke="var(--accent-green)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 3c: Resolution Time Distribution */}
            <ChartCard title="Resolution Time Distribution" subtitle={`Avg ${(resStats.avgHours / 24).toFixed(1)}d | Median ${(resStats.medianHours / 24).toFixed(1)}d | P90 ${(resStats.p90Hours / 24).toFixed(1)}d`}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.resolutionDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="bucket" tick={tickStyle} />
                  <YAxis tick={tickStyle} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name, props) => [`${value} tickets (${props.payload.pct}%)`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(analytics.resolutionDistribution || []).map((d, i) => (
                      <Cell key={i} fill={i === 0 ? 'var(--accent-green)' : i === 1 ? 'var(--accent-amber)' : 'var(--accent-red)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Percentage labels below */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
                {(analytics.resolutionDistribution || []).map((d, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: i === 0 ? 'var(--accent-green)' : i === 1 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                      {d.pct}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.bucket}</div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* 3d: Assignee Workload */}
            <ChartCard title="Assignee Workload" subtitle="Top 10 assignees by ticket volume">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.assigneeWorkload || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis type="number" tick={tickStyle} />
                  <YAxis dataKey="assignee" type="category" width={130} tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ════════════════════════════════════════════════════════════
              SECTION 5: Insights Panel
              ════════════════════════════════════════════════════════════ */}
          {insights.length > 0 && (
            <div style={{
              background: 'rgba(123,97,255,0.05)', border: '1px solid rgba(123,97,255,0.15)',
              borderRadius: 'var(--radius)', padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)' }}>
                <Lightbulb size={16} /> Key Insights
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ color: 'var(--text)' }}>{ins}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              SECTION 4: Recently Resolved (Collapsible)
              ════════════════════════════════════════════════════════════ */}
          <div style={{ marginTop: 4 }}>
            <button
              onClick={() => setResolvedOpen(!resolvedOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', cursor: 'pointer',
                color: 'var(--text)', fontSize: 13, fontWeight: 600, width: '100%',
                justifyContent: 'space-between',
              }}
            >
              <span>Recently Resolved ({resolved.length} tickets)</span>
              {resolvedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {resolvedOpen && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)',
                overflow: 'hidden',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Key', 'Summary', 'Category', 'Assignee', 'Resolved', 'Resolution Time'].map(h => (
                        <th key={h} style={{
                          padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                          color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
                          background: 'var(--bg-primary)', textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resolved.map((t, i) => (
                      <tr
                        key={t.key}
                        onClick={() => window.open(`${JIRA_BASE}${t.key}`, '_blank')}
                        style={{
                          cursor: 'pointer',
                          background: i % 2 ? 'var(--bg-stripe)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          <span style={{ color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {t.key} <ExternalLink size={9} style={{ opacity: 0.5 }} />
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', maxWidth: 350 }}>{t.summary}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}><CategoryTag category={t.category} /></td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{t.assignee}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{t.resolved}</td>
                        <td style={{
                          padding: '8px 12px', borderBottom: '1px solid var(--border)',
                          fontFamily: 'var(--font-mono)', fontWeight: 600,
                          color: t.resolutionHours < 24 ? 'var(--accent-green)' : t.resolutionHours < 72 ? 'var(--accent-amber)' : 'var(--accent-red)',
                        }}>
                          {formatResTime(t.resolutionHours)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
