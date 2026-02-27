import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import ChartCard from '../../components/ChartCard';
import AlertBanner from '../../components/AlertBanner';
import Badge from '../../components/Badge';
import DataSourceLabel from '../../components/DataSourceLabel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundaryCard from '../../components/ErrorBoundaryCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronDown, ChevronRight, Star, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { thStyle, tdStyle } from '../../utils/tableStyles';

const PIE_COLORS = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-amber)', 'var(--accent-purple)', '#FF6B6B', 'var(--accent-teal)', 'var(--accent-red)', 'var(--chart-tick, #9690B0)'];

/* ---- helpers ---- */
function groupByWeek(records, filterPlus) {
  if (!records?.length) return {};
  const weeks = {};
  records.forEach(r => {
    if (filterPlus !== undefined && r.Pluang_Plus__c !== filterPlus) return;
    const d = new Date(r.d);
    const wd = d.getDay();
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - wd);
    const m = weekStart.getMonth() + 1;
    const weekInMonth = Math.ceil(weekStart.getDate() / 7);
    const label = `W${weekInMonth} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1]}`;
    weeks[label] = (weeks[label] || 0) + r.cnt;
  });
  return weeks;
}

function buildWeeklyTable(records) {
  const regWeeks = groupByWeek(records, false);
  const plusWeeks = groupByWeek(records, true);
  const labels = [...new Set([...Object.keys(regWeeks), ...Object.keys(plusWeeks)])].sort((a, b) => {
    const mo = s => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(s);
    const [, wa, ma] = a.match(/W(\d) (\w+)/);
    const [, wb, mb] = b.match(/W(\d) (\w+)/);
    return mo(ma) - mo(mb) || Number(wa) - Number(wb);
  });
  const last4 = labels.slice(-4);
  return last4.map(w => ({
    week: w,
    regular: regWeeks[w] || 0,
    plus: plusWeeks[w] || 0,
    total: (regWeeks[w] || 0) + (plusWeeks[w] || 0),
  }));
}

function calcWoW(curr, prev) {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / prev * 100).toFixed(0);
}

function WoWCell({ curr, prev }) {
  const pct = calcWoW(curr, prev);
  if (pct === null) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>;
  const n = Number(pct);
  const color = n < 0 ? 'var(--accent-green)' : n > 0 ? 'var(--accent-red)' : 'var(--text-muted)';
  const Icon = n < 0 ? TrendingDown : n > 0 ? TrendingUp : Minus;
  return (
    <span style={{ color, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
      <Icon size={11} /> {Math.abs(n)}%
    </span>
  );
}

/* Local table style variants */
const thLeft = { ...thStyle, textAlign: 'left' };
const tdLeft = { ...tdStyle, textAlign: 'left', fontFamily: 'inherit', fontWeight: 500 };

export default function CODashboard() {
  const { data: vol } = useApi('/api/operations/weekly-volume?weeks=4');
  const { data: esc } = useApi('/api/operations/escalations?weeks=4');
  const { data: mix } = useApi('/api/operations/channel-mix');
  const { data: top } = useApi('/api/operations/top-issues?limit=5');
  const { data: ratings } = useApi('/api/operations/ratings');
  const { data: slaSummary } = useApi('/api/operations/sla-summary');
  const { data: highlights } = useApi('/api/operations/highlights');
  const { data: plusBreakdown } = useApi('/api/operations/plus-breakdown');

  const [plusOpen, setPlusOpen] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState(null);

  /* Weekly Volume Table */
  const weeklyRows = buildWeeklyTable(vol?.records);
  const lastIdx = weeklyRows.length - 1;

  /* Escalation data */
  const escWeekly = {};
  (esc?.records || []).forEach(r => {
    const d = new Date(r.d);
    const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
    const key = ws.toISOString().slice(5, 10);
    escWeekly[key] = (escWeekly[key] || 0) + r.cnt;
  });
  const escAgg = Object.entries(escWeekly).sort().map(([w, v]) => ({ week: w, escalations: v }));

  /* Channel mix */
  const channelData = (mix?.records || []).map(r => ({ name: r.Origin || 'Unknown', value: r.total }));

  /* Top issues */
  const topData = (top?.records || []).map(r => ({ name: r.Items__c, value: r.total }));
  const topIssueDescs = plusBreakdown?.topIssueDescriptions || {};

  /* SLA summary */
  const slaChannels = slaSummary?.channels || [];

  /* Highlights */
  const highlightList = highlights?.highlights || [];

  /* Plus breakdown */
  const plusIssues = plusBreakdown?.plusIssueBreakdown || [];
  const improvements = plusBreakdown?.playStoreImprovements || [];

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">CO Dashboard — Customer Feedbacks</div>
        {vol && <DataSourceLabel source={vol._source || 'salesforce'} updated={vol._updated} />}
      </div>

      {/* Weekly Highlights */}
      {highlightList.length > 0 && (
        <div style={{
          background: 'rgba(54,215,183,0.06)', border: '1px solid rgba(54,215,183,0.2)',
          borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-teal)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={14} /> Weekly Highlights
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.8, color: 'var(--text)' }}>
            {highlightList.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      <AlertBanner type="info" dismissible>
        Since 4 Feb 2026, Response Time includes queue time — Feb W1 is the new baseline. SF data refreshes every 5 min.
      </AlertBanner>

      {/* ── Weekly Volume Table ── */}
      <ChartCard title="Total Created Tickets" subtitle="Weekly volume breakdown (excl. spam)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thLeft}>Segment</th>
                {weeklyRows.map((w, i) => <th key={i} style={thStyle}>{w.week}</th>)}
                <th style={thStyle}>WoW Δ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdLeft}>Regular</td>
                {weeklyRows.map((w, i) => <td key={i} style={tdStyle}>{w.regular.toLocaleString()}</td>)}
                <td style={tdStyle}>
                  {lastIdx > 0 && <WoWCell curr={weeklyRows[lastIdx].regular} prev={weeklyRows[lastIdx - 1].regular} />}
                </td>
              </tr>
              <tr style={{ background: 'rgba(167,139,250,0.04)' }}>
                <td style={tdLeft}>Pluang Plus</td>
                {weeklyRows.map((w, i) => <td key={i} style={tdStyle}>{w.plus.toLocaleString()}</td>)}
                <td style={tdStyle}>
                  {lastIdx > 0 && <WoWCell curr={weeklyRows[lastIdx].plus} prev={weeklyRows[lastIdx - 1].plus} />}
                </td>
              </tr>
              <tr style={{ fontWeight: 600 }}>
                <td style={tdLeft}>Total</td>
                {weeklyRows.map((w, i) => <td key={i} style={tdStyle}>{w.total.toLocaleString()}</td>)}
                <td style={tdStyle}>
                  {lastIdx > 0 && <WoWCell curr={weeklyRows[lastIdx].total} prev={weeklyRows[lastIdx - 1].total} />}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* ── SLA Summary Inline ── */}
      <ChartCard title="SLA Summary" subtitle="Response time SLA % by channel (current week)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thLeft}>Channel</th>
                <th style={thStyle}>SLA %</th>
                <th style={thStyle}>FRT (Median)</th>
                <th style={thStyle}>vs Target</th>
              </tr>
            </thead>
            <tbody>
              {slaChannels.map((ch, i) => {
                const delta = ch.sla - (ch.target || 0);
                const met = delta >= 0;
                return (
                  <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                    <td style={tdLeft}>{ch.channel}</td>
                    <td style={{ ...tdStyle, color: ch.sla >= 90 ? 'var(--accent-green)' : ch.sla >= 75 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                      {ch.sla}%
                    </td>
                    <td style={tdStyle}>{ch.frtMedian}</td>
                    <td style={tdStyle}>
                      <Badge variant={met ? 'success' : 'error'}>
                        {met ? `+${delta}pp` : `${delta}pp`}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {slaChannels.length === 0 && (
                <tr><td colSpan={4} style={{ ...tdLeft, textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Loading SLA data...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* ── CSAT Hero ── */}
      <ChartCard title="CSAT Ratings" subtitle="Customer satisfaction — Human Assisted vs Bot" mock>
        <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Overall CSAT</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 42, fontWeight: 700, color: 'var(--accent-amber)', lineHeight: 1 }}>
              {ratings?.csat?.all || '3.9'}
            </div>
            <div style={{ color: 'var(--accent-amber)', fontSize: 16, marginTop: 2 }}>
              {'★'.repeat(Math.round(ratings?.csat?.all || 3.9))}{'☆'.repeat(5 - Math.round(ratings?.csat?.all || 3.9))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(0,208,156,0.06)', borderRadius: 8, border: '1px solid rgba(0,208,156,0.15)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Human Assisted</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--accent-green)' }}>
                {ratings?.csat?.human || '4.3'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(255,71,87,0.06)', borderRadius: 8, border: '1px solid rgba(255,71,87,0.15)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Bot Only</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--accent-red)' }}>
                3.2
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 260, lineHeight: 1.6 }}>
            <strong>Note:</strong> Human-assisted CSAT improved to 4.3 in W3 Feb.
            DSAT rate 18.4% — driven primarily by bot-only sessions and email channel.
            CSAT sourced from BQ (mock placeholder).
          </div>
        </div>
      </ChartCard>

      {/* ── Pluang Plus Deep Dive (Collapsible) ── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 16,
      }}>
        <button
          onClick={() => setPlusOpen(!plusOpen)}
          style={{
            width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(167,139,250,0.04)', border: 'none', cursor: 'pointer',
            color: 'var(--text)', fontSize: 14, fontWeight: 600, textAlign: 'left',
            borderBottom: plusOpen ? '1px solid var(--border)' : 'none',
          }}
        >
          {plusOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Star size={14} style={{ color: 'var(--accent-purple)' }} />
          Pluang Plus — Deep Dive
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
            Issue breakdown by week
          </span>
        </button>
        {plusOpen && (
          <div style={{ padding: 20 }}>
            {plusIssues.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thLeft}>Issue</th>
                      <th style={thStyle}>W1</th>
                      <th style={thStyle}>W2</th>
                      <th style={thStyle}>W3</th>
                      <th style={thStyle}>W4</th>
                      <th style={thStyle}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plusIssues.map((issue, i) => (
                      <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                        <td style={tdLeft}>{issue.issue}</td>
                        <td style={tdStyle}>{issue.w1}</td>
                        <td style={tdStyle}>{issue.w2}</td>
                        <td style={tdStyle}>{issue.w3}</td>
                        <td style={tdStyle}>{issue.w4}</td>
                        <td style={tdStyle}>
                          <Badge variant={issue.trend === 'up' ? 'error' : issue.trend === 'down' ? 'success' : 'info'}>
                            {issue.trend === 'up' ? '↑' : issue.trend === 'down' ? '↓' : '—'} {issue.trend}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {plusIssues.some(p => p.description) && (
                  <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    {plusIssues.filter(p => p.description).map((p, i) => (
                      <div key={i} style={{ marginBottom: 4 }}>
                        <strong>{p.issue}:</strong> {p.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                No Plus issue breakdown data available (mock endpoint required).
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Escalations + Channel Mix + Top Issues ── */}
      <div className="grid-3">
        <ChartCard title="Total Escalation Tickets" subtitle="Weekly escalation count">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={escAgg}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
              <XAxis dataKey="week" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg, #1C1835)', border: '1px solid var(--chart-tooltip-border, #3D3568)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="escalations" fill="var(--accent-red)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Ticket by Channel" subtitle="Last 7 days">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={channelData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                {channelData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg, #1C1835)', border: '1px solid var(--chart-tooltip-border, #3D3568)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top Issues" subtitle="By volume (last 30 days, excl. spam)">
          <div style={{ fontSize: 12 }}>
            {topData.map((item, i) => (
              <div key={i}>
                <div
                  onClick={() => setExpandedIssue(expandedIssue === item.name ? null : item.name)}
                  style={{
                    padding: '8px 10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid var(--border)',
                    background: expandedIssue === item.name ? 'rgba(167,139,250,0.06)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {topIssueDescs[item.name] ? (
                      expandedIssue === item.name ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                    ) : <span style={{ width: 12 }} />}
                    {item.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.value.toLocaleString()}</span>
                </div>
                {expandedIssue === item.name && topIssueDescs[item.name] && (
                  <div style={{
                    padding: '8px 10px 8px 28px', fontSize: 11, color: 'var(--text-muted)',
                    lineHeight: 1.6, background: 'rgba(167,139,250,0.03)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {topIssueDescs[item.name]}
                  </div>
                )}
              </div>
            ))}
            {topData.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* ── App Store Ratings + Improvements ── */}
      <div className="grid-2">
        <ChartCard title="App Store Ratings" subtitle="Play Store & App Store" mock>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--accent-green)' }}>
                {ratings?.appRatings?.google || '4.7'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Google Play</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: 'var(--accent-blue)' }}>
                {ratings?.appRatings?.apple || '4.6'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>App Store</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={thLeft}>Category</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>5★</th>
                  <th style={thStyle}>1★</th>
                </tr>
              </thead>
              <tbody>
                {(ratings?.playStoreCategories || []).map((c, i) => (
                  <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                    <td style={tdLeft}>{c.name}</td>
                    <td style={tdStyle}>{c.total}</td>
                    <td style={tdStyle}>{c.s5}</td>
                    <td style={tdStyle}>{c.s1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Improvement Opportunities" subtitle="From Play Store reviews — root causes" mock>
          <div style={{ fontSize: 12 }}>
            {improvements.map((item, i) => (
              <div key={i} style={{
                padding: '10px 12px', borderBottom: '1px solid var(--border)',
                background: i % 2 ? 'var(--bg-stripe)' : 'transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{item.category}</span>
                  <Badge variant="info">{item.reviews} reviews</Badge>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {item.description}
                </div>
              </div>
            ))}
            {improvements.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading improvement data...
              </div>
            )}
          </div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(255,176,32,0.06)', borderRadius: 6, border: '1px solid rgba(255,176,32,0.15)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong>Root Cause Note:</strong> Withdrawal complexity and fee transparency are structural UX issues.
            App crashes have decreased W3→W4 but remain a concern during market hours.
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
