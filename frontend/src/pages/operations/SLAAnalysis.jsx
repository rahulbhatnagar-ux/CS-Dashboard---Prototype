import React, { useState, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../../components/MetricCard';
import ChartCard from '../../components/ChartCard';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import DataSourceLabel from '../../components/DataSourceLabel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundaryCard from '../../components/ErrorBoundaryCard';
import AlertBanner from '../../components/AlertBanner';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import {
  Shield, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Activity, Timer, Info, ChevronDown, ChevronRight, Download, Copy, FileText,
} from 'lucide-react';
import { tooltipStyle, tickStyle, gridStroke } from '../../utils/chartConfig';
import { thStyle, tdStyle, thLeft, tdLeft } from '../../utils/tableStyles';

/* ── Constants ── */

const CHANNEL_COLORS = {
  'Live Chat': 'var(--accent-blue)',
  'In-App': 'var(--accent-green)',
  EmailCase: 'var(--accent-amber)',
  Email: 'var(--accent-red)',
  Phone: 'var(--accent-purple)',
  'L1 Agent': 'var(--accent-teal)',
};

const CHANNEL_ORDER = ['Live Chat', 'In-App', 'Phone', 'EmailCase', 'Email', 'L1 Agent'];

const FRT_TARGETS = {
  'Live Chat': 5, 'In-App': 5, Phone: 3, EmailCase: 480, Email: 720, 'L1 Agent': 240,
};

/* ── Helpers ── */

function slaColor(pct) {
  if (pct === null || pct === undefined) return 'var(--text-muted)';
  if (pct >= 90) return 'var(--accent-green)';
  if (pct >= 80) return 'var(--accent-amber)';
  return 'var(--accent-red)';
}

function slaBg(pct) {
  if (pct === null || pct === undefined) return 'transparent';
  if (pct >= 90) return 'rgba(0,208,156,0.12)';
  if (pct >= 80) return 'rgba(255,176,32,0.12)';
  return 'rgba(255,71,87,0.12)';
}

function formatFRT(minutes) {
  if (!minutes || minutes <= 0) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDays(days) {
  if (!days || days <= 0) return '—';
  return `${days.toFixed(1)}d`;
}

function kpiColor(value, greenMax, amberMax) {
  if (value <= greenMax) return 'green';
  if (value <= amberMax) return 'amber';
  return 'red';
}

function DeltaBadge({ value }) {
  if (value === null || value === undefined || isNaN(value)) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const isPos = value > 0;
  const isNeg = value < 0;
  const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
  const color = isPos ? 'var(--accent-green)' : isNeg ? 'var(--accent-red)' : 'var(--text-muted)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>
      <Icon size={12} /> {isPos ? '+' : ''}{value.toFixed(1)}pp
    </span>
  );
}


/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

export default function SLAAnalysis() {
  /* ── State ── */
  const [days, setDays] = useState(90);
  const [defsOpen, setDefsOpen] = useState(false);
  const [drillCategory, setDrillCategory] = useState(null);
  const [showAllSubs, setShowAllSubs] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  /* ── API calls ── */
  const { data: summary, loading: l1, error: e1, refetch: r1 } = useApi(`/api/sla/summary?days=${days}`, [days]);
  const { data: trend, loading: l2, error: e2, refetch: r2 } = useApi('/api/sla/trend?months=6');
  const { data: frtTrend, loading: l3, error: e3, refetch: r3 } = useApi('/api/sla/frt-trend?months=6');
  const { data: cycleTrend, loading: l4, error: e4, refetch: r4 } = useApi('/api/sla/cycle-trend?months=6');
  const { data: catData, loading: l5, error: e5, refetch: r5 } = useApi(`/api/sla/by-category?days=${days}`, [days]);

  const subCatUrl = drillCategory ? `/api/sla/by-subcategory?days=${days}&category=${encodeURIComponent(drillCategory)}` : null;
  const { data: subCatData, loading: l6, error: e6, refetch: r6 } = useApi(subCatUrl, [days, drillCategory]);

  const [sYear, sMonth] = summaryMonth.split('-').map(Number);
  const { data: monthlySummary, loading: l7, error: e7, refetch: r7 } = useApi(
    `/api/sla/monthly-summary?year=${sYear}&month=${sMonth}`, [summaryMonth]
  );

  const anyLoading = l1 && l2;

  /* ── Derived data ── */
  const trendChannels = useMemo(() => {
    if (!trend?.channels) return [];
    return CHANNEL_ORDER.filter(ch => trend.channels.includes(ch));
  }, [trend]);

  const frtChannels = useMemo(() => {
    if (!frtTrend?.channels) return [];
    return CHANNEL_ORDER.filter(ch => frtTrend.channels.includes(ch));
  }, [frtTrend]);

  /* ── Custom tooltip for SLA trend ── */
  const SlaTrendTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ ...tooltipStyle, padding: '10px 14px' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => {
          const total = trend?.trend?.find(t => t.month === label)?.[`${p.dataKey}_total`];
          const met = trend?.trend?.find(t => t.month === label)?.[`${p.dataKey}_met`];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '2px 0' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span>{p.name}: <strong>{p.value}%</strong></span>
              {total !== undefined && met !== undefined && (
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({met?.toLocaleString()} / {total?.toLocaleString()})</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Custom tooltip for FRT trend ── */
  const FrtTrendTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ ...tooltipStyle, padding: '10px 14px' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => {
          const count = frtTrend?.trend?.find(t => t.month === label)?.[`${p.dataKey}_count`];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '2px 0' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span>{p.name}: <strong>{formatFRT(p.value)}</strong></span>
              {count !== undefined && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({count?.toLocaleString()} cases)</span>}
            </div>
          );
        })}
      </div>
    );
  };


  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">SLA Analysis</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {summary && <DataSourceLabel source={summary._source || 'salesforce'} updated={summary._updated} />}
        </div>
      </div>

      {/* ── Top Controls ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          style={{
            padding: '6px 12px', fontSize: 12, borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text)', cursor: 'pointer',
          }}
        >
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={180}>Last 6 months</option>
        </select>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Excluding spam &amp; merged cases
        </div>
      </div>

      {anyLoading && <LoadingSpinner message="Loading SLA data from Salesforce..." />}

      {/* ════════════════════════════════════════════════════════════
          SECTION 1: SLA Definitions (Collapsible)
          ════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setDefsOpen(!defsOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            background: 'transparent', border: 'none', color: 'var(--accent-blue)',
            cursor: 'pointer', fontSize: 12, fontWeight: 500,
          }}
        >
          {defsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Info size={13} /> SLA Definitions
        </button>

        {defsOpen && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: 20, marginTop: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>SLA Metric Definitions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Metric</th>
                    <th style={{ ...thLeft, minWidth: 400 }}>Definition</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { metric: 'First Response Time (FRT)', def: 'Time from case creation to first agent reply. SF field: X1st_agent_response_time__c (minutes). Coverage: ~57% of cases (agent-handled only). Since 4 Feb 2026, includes queue wait time.' },
                    { metric: 'SLA Achievement (SLA %)', def: 'Percentage of cases where FRT met the channel target. SF field: SLA_Breached__c (boolean). SLA_Breached__c = false means SLA was MET. Coverage: 100% of cases.' },
                    { metric: 'Ticket Aging', def: 'Total calendar time from creation to current/closure. SF field: Ticket_Aging__c (minutes). Coverage: 97% of cases. Does NOT pause during "Waiting on User" status.' },
                    { metric: 'Agent Aging', def: 'Time ticket spent in agent-active statuses only. SF field: Agent_Aging__c (minutes). Coverage: 77% of cases.' },
                    { metric: 'Cycle Time', def: 'ClosedDate - CreatedDate for resolved tickets. Calculated field (not stored in SF). Only for Status = Closed or Resolved.' },
                    { metric: 'Resolution Time (Active Handling)', def: 'DOES NOT EXIST YET in SF. Should pause during WoU/Resolved/Closed statuses. Currently approximated via Agent_Aging__c.' },
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                      <td style={{ ...tdLeft, fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.metric}</td>
                      <td style={{ ...tdLeft, lineHeight: 1.5 }}>{row.def}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 20, marginBottom: 12 }}>Channel SLA Targets (FRT-based)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, maxWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Channel</th>
                    <th style={thStyle}>FRT Target</th>
                    <th style={{ ...thLeft, paddingLeft: 16 }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ch: 'Live Chat', target: '5 minutes', note: 'Real-time channel, fastest target' },
                    { ch: 'In-App', target: '5 minutes', note: 'Same as Live Chat' },
                    { ch: 'Phone', target: '3 minutes', note: 'Call pickup target' },
                    { ch: 'EmailCase', target: '8 hours', note: 'Business hours' },
                    { ch: 'Email', target: '12 hours', note: 'Standard email SLA' },
                    { ch: 'L1 Agent', target: '4 hours', note: 'Internal escalation' },
                  ].map((row, i) => (
                    <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                      <td style={tdLeft}>{row.ch}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{row.target}</td>
                      <td style={{ ...tdLeft, paddingLeft: 16, color: 'var(--text-muted)' }}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>


      {/* ════════════════════════════════════════════════════════════
          SECTION 2: KPI Summary Cards
          ════════════════════════════════════════════════════════════ */}
      {e1 && <ErrorBoundaryCard error={e1} onRetry={r1} />}
      {summary && (
        <div className="grid-5">
          <MetricCard
            label="SLA Achievement"
            value={`${summary.slaAchievement}%`}
            icon={Shield}
            color={summary.slaAchievement >= 90 ? 'green' : summary.slaAchievement >= 80 ? 'amber' : 'red'}
            subtitle={`${summary.metCount.toLocaleString()} of ${summary.totalCases.toLocaleString()} cases met FRT target`}
          />
          <MetricCard
            label="Avg First Response"
            value={formatFRT(summary.avgFRTMinutes)}
            icon={Clock}
            color={kpiColor(summary.avgFRTMinutes, 60, 180)}
            subtitle={`agent-handled (${summary.frtCount.toLocaleString()} cases)`}
          />
          <MetricCard
            label="Avg Ticket Aging"
            value={formatDays(summary.avgAgingDays)}
            icon={Timer}
            color={kpiColor(summary.avgAgingDays, 3, 7)}
            subtitle={`creation to closure (${summary.agingCount.toLocaleString()} cases)`}
          />
          <MetricCard
            label="Avg Agent Handling"
            value={formatDays(summary.avgAgentDays)}
            icon={Activity}
            color={kpiColor(summary.avgAgentDays, 2, 5)}
            subtitle={`active agent time (${summary.agentAgingCount.toLocaleString()} cases)`}
          />
          <MetricCard
            label="Avg Cycle Time"
            value={formatDays(summary.avgCycleDays)}
            icon={FileText}
            color={kpiColor(summary.avgCycleDays, 3, 7)}
            subtitle={`closed cases (${summary.cycleCount.toLocaleString()} cases)`}
          />
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════
          SECTION 3 & 4: SLA % Trend + FRT Trend (side by side)
          ════════════════════════════════════════════════════════════ */}
      <div className="grid-2">
        {/* ── Section 3: SLA % Monthly Trend ── */}
        <div>
          {e2 && <ErrorBoundaryCard error={e2} onRetry={r2} />}
          {trend && (
            <ChartCard title="SLA % Monthly Trend" subtitle="By channel (6 months). Dashed line = 85% target.">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" tick={tickStyle} />
                  <YAxis domain={[0, 100]} tick={tickStyle} />
                  <Tooltip content={<SlaTrendTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={85} stroke="var(--text-muted)" strokeDasharray="6 4" label={{ value: '85% target', fill: 'var(--text-muted)', fontSize: 10, position: 'insideTopRight' }} />
                  {trendChannels.map(ch => (
                    <Line key={ch} type="monotone" dataKey={ch} name={ch}
                      stroke={CHANNEL_COLORS[ch] || 'var(--text-muted)'}
                      strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* ── Section 4: FRT Monthly Trend ── */}
        <div>
          {e3 && <ErrorBoundaryCard error={e3} onRetry={r3} />}
          {frtTrend && (
            <ChartCard title="Avg First Response Time Trend" subtitle="By channel (minutes). Lower = better.">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={frtTrend.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="month" tick={tickStyle} />
                  <YAxis tick={tickStyle} tickFormatter={v => formatFRT(v)} />
                  <Tooltip content={<FrtTrendTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {frtChannels.map(ch => (
                    <Bar key={ch} dataKey={ch} name={ch}
                      fill={CHANNEL_COLORS[ch] || 'var(--text-muted)'}
                      radius={[2, 2, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </div>

      {/* FRT caveat banner */}
      <AlertBanner type="warning" dismissible>
        FRT is only available for ~57% of cases (agent-handled channels). Live Chat/In-App FRT data may be incomplete — no queue wait time tracked before Feb 4, 2026.
      </AlertBanner>


      {/* ════════════════════════════════════════════════════════════
          SECTION 5: Cycle Time Trend (Ticket Aging vs Agent Aging)
          ════════════════════════════════════════════════════════════ */}
      {e4 && <ErrorBoundaryCard error={e4} onRetry={r4} />}
      {cycleTrend && (cycleTrend.trend || []).length > 0 && (
        <ChartCard title="Cycle Time Trend" subtitle="Ticket Aging (total) vs Agent Aging (active). Gap = non-agent wait time.">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cycleTrend.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" tick={tickStyle} />
              <YAxis tick={tickStyle} tickFormatter={v => `${v}d`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [`${value} days`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="ticketAgingDays" name="Ticket Aging (Total)"
                fill="var(--accent-blue)" fillOpacity={0.15} stroke="var(--accent-blue)" strokeWidth={2} />
              <Area type="monotone" dataKey="agentAgingDays" name="Agent Aging (Active)"
                fill="var(--accent-green)" fillOpacity={0.25} stroke="var(--accent-green)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{
            marginTop: 10, padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)',
            background: 'rgba(123,97,255,0.06)', borderRadius: 6, border: '1px solid rgba(123,97,255,0.15)', lineHeight: 1.6,
          }}>
            <strong>Insight:</strong> The gap between Ticket Aging and Agent Aging represents non-agent time (customer wait, queue, WoU status).
            Minimizing this gap is the Phase 2 target for the Resolution Time metric (currently does not exist in SF).
          </div>
        </ChartCard>
      )}


      {/* ════════════════════════════════════════════════════════════
          SECTION 6: SLA by Ticket Category (Heatmap)
          ════════════════════════════════════════════════════════════ */}
      {e5 && <ErrorBoundaryCard error={e5} onRetry={r5} />}
      {catData && (
        <ChartCard title="SLA % by Ticket Category" subtitle={`Heatmap: Green >=90%, Amber 80-90%, Red <80%. Click a row to drill down. Last ${days} days.`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ ...thLeft, position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-primary)' }}>Category</th>
                  <th style={thStyle}>All</th>
                  {(catData.channels || []).filter(ch => CHANNEL_ORDER.includes(ch)).sort((a, b) => CHANNEL_ORDER.indexOf(a) - CHANNEL_ORDER.indexOf(b)).map(ch => (
                    <th key={ch} style={thStyle}>{ch}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(catData.rows || []).map((row, i) => {
                  const isSelected = drillCategory === row.category;
                  const displayChannels = (catData.channels || []).filter(ch => CHANNEL_ORDER.includes(ch)).sort((a, b) => CHANNEL_ORDER.indexOf(a) - CHANNEL_ORDER.indexOf(b));
                  return (
                    <tr key={i}
                      onClick={() => setDrillCategory(isSelected ? null : row.category)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(123,97,255,0.08)' : (i % 2 ? 'var(--bg-stripe)' : 'transparent'),
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ ...tdLeft, position: 'sticky', left: 0, background: isSelected ? 'rgba(123,97,255,0.08)' : 'var(--bg-card)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {isSelected ? <ChevronDown size={12} style={{ marginRight: 4 }} /> : <ChevronRight size={12} style={{ marginRight: 4 }} />}
                        {row.category}
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>({row.all_total?.toLocaleString()})</span>
                      </td>
                      <td style={{ ...tdStyle, background: slaBg(row.all), color: slaColor(row.all), fontWeight: 700 }}>
                        {row.all !== null ? `${row.all}%` : '—'}
                      </td>
                      {displayChannels.map(ch => (
                        <td key={ch} style={{ ...tdStyle, background: slaBg(row[ch]), color: slaColor(row[ch]) }}>
                          {row[ch] !== null && row[ch] !== undefined ? `${row[ch]}%` : '—'}
                          {row[`${ch}_total`] > 0 && (
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                              n={row[`${ch}_total`]}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}


      {/* ════════════════════════════════════════════════════════════
          SECTION 7: Sub-Category Drill-down
          ════════════════════════════════════════════════════════════ */}
      {drillCategory && (
        <div>
          {l6 && <LoadingSpinner message={`Loading sub-categories for "${drillCategory}"...`} />}
          {e6 && <ErrorBoundaryCard error={e6} onRetry={r6} />}
          {subCatData && (
            <ChartCard title={`Sub-Category Drill-down: ${drillCategory}`} subtitle={`${subCatData.rows?.length || 0} sub-categories. Last ${days} days.`}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Sub Category</th>
                      <th style={thStyle}>Volume</th>
                      <th style={thStyle}>SLA %</th>
                      <th style={thStyle}>Avg FRT</th>
                      <th style={thStyle}>Avg Aging (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllSubs ? subCatData.rows : (subCatData.rows || []).slice(0, 20)).map((row, i) => (
                      <tr key={i} style={{
                        background: row.slaPct < 80 ? 'rgba(255,71,87,0.06)' : (i % 2 ? 'var(--bg-stripe)' : 'transparent'),
                      }}>
                        <td style={tdLeft}>{row.subCategory}</td>
                        <td style={tdStyle}>{row.volume?.toLocaleString()}</td>
                        <td style={{ ...tdStyle, color: slaColor(row.slaPct), fontWeight: 600 }}>
                          {row.slaPct}%
                        </td>
                        <td style={tdStyle}>{formatFRT(row.avgFRTMinutes)}</td>
                        <td style={tdStyle}>{row.avgAgingDays ? formatDays(row.avgAgingDays) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(subCatData.rows || []).length > 20 && !showAllSubs && (
                <button
                  onClick={() => setShowAllSubs(true)}
                  style={{
                    marginTop: 10, padding: '6px 14px', fontSize: 12,
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: 6, color: 'var(--accent-blue)', cursor: 'pointer',
                  }}
                >
                  Show all {subCatData.rows.length} sub-categories
                </button>
              )}
            </ChartCard>
          )}
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════
          SECTION 8: Monthly Management Summary
          ════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Monthly Management Summary</div>
          <input
            type="month"
            value={summaryMonth}
            onChange={e => setSummaryMonth(e.target.value)}
            style={{
              padding: '4px 10px', fontSize: 12, borderRadius: 6,
              border: '1px solid var(--border)', background: 'var(--bg-card)',
              color: 'var(--text)', cursor: 'pointer',
            }}
          />
        </div>
        {l7 && <LoadingSpinner message="Loading monthly summary..." />}
        {e7 && <ErrorBoundaryCard error={e7} onRetry={r7} />}
        {monthlySummary && (
          <div id="monthly-summary-card" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '24px', position: 'relative',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  MONTHLY SLA REPORT — {monthlySummary.monthLabel}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Source: Salesforce Live (plg-prod) | Generated: {new Date(monthlySummary._updated).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById('monthly-summary-card');
                  if (el) {
                    const text = el.innerText;
                    navigator.clipboard.writeText(text);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                  background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11,
                }}
              >
                <Copy size={12} /> Copy
              </button>
            </div>

            {/* Overall */}
            <div style={{
              padding: '16px 20px', marginBottom: 20,
              background: monthlySummary.overallSLA >= 85 ? 'rgba(0,208,156,0.08)' : 'rgba(255,71,87,0.08)',
              border: `1px solid ${monthlySummary.overallSLA >= 85 ? 'rgba(0,208,156,0.2)' : 'rgba(255,71,87,0.2)'}`,
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: slaColor(monthlySummary.overallSLA) }}>
                {monthlySummary.overallSLA}% SLA Achievement
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                  (Target: 85%)
                </span>
              </div>
              <div style={{ marginTop: 6, fontSize: 13 }}>
                <DeltaBadge value={monthlySummary.overallDelta} />
                <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 12 }}>
                  vs {monthlySummary.priorMonthLabel} ({monthlySummary.priorOverallSLA}%)
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Total volume: {monthlySummary.totalVolume?.toLocaleString()} cases
              </div>
            </div>

            {/* Channel Breakdown Table */}
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Channel Breakdown</div>
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={thLeft}>Channel</th>
                    <th style={thStyle}>Volume</th>
                    <th style={thStyle}>SLA %</th>
                    <th style={thStyle}>Avg FRT</th>
                    <th style={thStyle}>vs {monthlySummary.priorMonthLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {(monthlySummary.channelBreakdown || []).map((ch, i) => (
                    <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                      <td style={tdLeft}>{ch.channel}</td>
                      <td style={tdStyle}>{ch.volume?.toLocaleString()}</td>
                      <td style={{ ...tdStyle, color: slaColor(ch.slaPct), fontWeight: 600 }}>{ch.slaPct}%</td>
                      <td style={tdStyle}>{formatFRT(ch.avgFRTMinutes)}</td>
                      <td style={tdStyle}><DeltaBadge value={ch.deltapp} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Worst Categories */}
            {(monthlySummary.worstCategories || []).length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Top 5 Worst SLA Categories</div>
                {monthlySummary.worstCategories.map((cat, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                    borderBottom: '1px solid var(--border)', fontSize: 12,
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, minWidth: 18 }}>{i + 1}.</span>
                    <span style={{ flex: 1 }}>{cat.category}</span>
                    <Badge variant={cat.slaPct >= 90 ? 'success' : cat.slaPct >= 80 ? 'warning' : 'error'}>
                      {cat.slaPct}%
                    </Badge>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      ({cat.breached} / {cat.total} breached)
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Observations */}
            {(monthlySummary.observations || []).length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Key Observations</div>
                {monthlySummary.observations.map((obs, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12, color: 'var(--text)' }}>
                    <span style={{ color: 'var(--accent-blue)' }}>•</span>
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{
              marginTop: 20, paddingTop: 12, borderTop: '1px solid var(--border)',
              fontSize: 10, color: 'var(--text-muted)',
            }}>
              Source: Salesforce Live (plg-prod) | Last refresh: {new Date(monthlySummary._updated).toLocaleTimeString()} | Cases excl. spam &amp; merged
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
