import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../../components/MetricCard';
import ChartCard from '../../components/ChartCard';
import DataSourceLabel from '../../components/DataSourceLabel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundaryCard from '../../components/ErrorBoundaryCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, PieChart, Pie, AreaChart, Area,
} from 'recharts';
import {
  Mail, TrendingUp, ArrowRightLeft, AlertTriangle, Merge, Phone,
  Shield, Zap, CheckCircle, XCircle, ArrowRight, ArrowDown, Smartphone,
  RefreshCw, ChevronDown, ChevronUp, Users, Layers, Eye,
} from 'lucide-react';
import { tooltipStyle, tickStyle, gridStroke } from '../../utils/chartConfig';
import { thCompact as thStyle, tdCompact as tdStyle } from '../../utils/tableStyles';

/* ── Helpers ── */
function InsightBox({ children, color = 'var(--accent-blue)' }) {
  return (
    <div style={{ borderLeft: `4px solid ${color}`, background: 'rgba(123,97,255,0.04)', padding: '12px 16px', borderRadius: '0 var(--radius) var(--radius) 0', fontSize: 12, lineHeight: 1.6, fontStyle: 'italic', color: 'var(--text)', marginBottom: 16 }}>
      {children}
    </div>
  );
}

function SectionHeader({ number, title, subtitle }) {
  return (
    <div style={{ marginTop: 28, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', background: 'rgba(123,97,255,0.1)', padding: '2px 10px', borderRadius: 4 }}>SECTION {number}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
      </div>
      {subtitle && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 0 }}>{subtitle}</div>}
    </div>
  );
}

function EffortBadge({ label, color }) {
  const colors = {
    red: { bg: 'rgba(255,71,87,0.12)', border: 'rgba(255,71,87,0.3)', text: '#FF4757' },
    amber: { bg: 'rgba(255,176,32,0.12)', border: 'rgba(255,176,32,0.3)', text: '#FFB020' },
    green: { bg: 'rgba(0,208,156,0.12)', border: 'rgba(0,208,156,0.3)', text: '#00D09C' },
  };
  const c = colors[color] || colors.amber;
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontSize: 10, fontWeight: 700 }}>{label}</span>;
}

function fcrColor(fcr) {
  if (fcr < 76) return 'var(--accent-red)';
  if (fcr < 82) return 'var(--accent-amber)';
  return 'var(--accent-green)';
}

/* ══════════════════════════════════════════════════════════════ */

export default function ChannelMix() {
  const { data, loading, error, refetch } = useApi('/api/channel-effort');
  const [showDevVer, setShowDevVer] = useState(false);

  const sum = data?.summary || {};
  const mix = data?.channelMix || {};
  const res = data?.resolution || {};
  const sw = data?.switching || {};
  const dv = data?.deviceVerification || {};
  const rec = data?.recommendation || {};
  const merged = sw.merged || {};
  const venn = sw.venn || {};
  const corr = merged.correlations || {};

  // Prepare monthly shift data for stacked area chart
  const monthlyArea = (mix.monthlyShift || []).map(m => ({
    month: m.month.replace('2025', "'25").replace('2026', "'26"),
    Email: m.emailPct,
    'Live Chat': m.liveChatPct,
    'In-App': m.inAppPct,
    Phone: m.phonePct,
    'L1 Agent': m.l1Pct,
    Social: m.socialPct,
  }));

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="page-title">Channel Effort & Resolution Analysis</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Source: Salesforce Live | 58,957 tickets | 30,818 users | 36,028 issue clusters
          </div>
        </div>
        {data && <DataSourceLabel source={data._source || 'salesforce'} updated={data._updated} />}
      </div>

      {loading && <LoadingSpinner message="Loading channel effort data..." />}
      {error && <ErrorBoundaryCard error={error} onRetry={refetch} />}

      {data && (
        <>
          {/* ════════════ SECTION 1: HEADLINE METRICS ════════════ */}
          <SectionHeader number={1} title="Headline Metrics" subtitle="Customer effort, agent rework, and resolution effectiveness by channel" />

          <div className="grid-5">
            <MetricCard label="True Email Share" value={`${sum.trueEmailShare?.value}%`} icon={Mail} color="red" subtitle={`${sum.trueEmailShare?.numerator?.toLocaleString()} / ${sum.trueEmailShare?.denominator?.toLocaleString()} \u2014 ${sum.trueEmailShare?.subtitle}`} />
            <MetricCard label="Overall FCR" value={`${sum.overallFCR?.value}%`} icon={TrendingUp} color="amber" subtitle={`${sum.overallFCR?.numerator?.toLocaleString()} / ${sum.overallFCR?.denominator?.toLocaleString()} \u2014 ${sum.overallFCR?.subtitle}`} />
            <MetricCard label="Channel Switchers" value={`${sum.channelSwitchers?.value?.toLocaleString()}`} icon={ArrowRightLeft} color="red" subtitle={`${sum.channelSwitchers?.pct}% of ${sum.channelSwitchers?.totalUsers?.toLocaleString()} users`} />
            <MetricCard label="Merge Rate" value={`${sum.mergeRate?.value}%`} icon={Merge} color="amber" subtitle={`${sum.mergeRate?.count?.toLocaleString()} tickets \u2014 ${sum.mergeRate?.subtitle}`} />
            <MetricCard label="L2 Escalation" value={`${sum.l2Escalation?.value}%`} icon={AlertTriangle} color="red" subtitle={`${sum.l2Escalation?.count?.toLocaleString()} tickets \u2014 ${sum.l2Escalation?.subtitle}`} />
          </div>

          {/* ════════════ SECTION 2: THE REAL CHANNEL MIX ════════════ */}
          <SectionHeader number={2} title="The Real Channel Mix" subtitle="Email dominance correction, distribution, and post-HC-launch shift" />

          {/* 2A: Correction Panel */}
          <div style={{
            background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)',
            borderLeft: '5px solid var(--accent-red)', borderRadius: 'var(--radius)',
            padding: '16px 20px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 6 }}>
              Email Is Not 9%
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text)' }}>
              {mix.correctionInsight}
            </div>
          </div>

          {/* 2B: Channel Distribution (bar + pie side by side) */}
          <div className="grid-2">
            <ChartCard title="Grouped Channel Distribution" subtitle="Combined channel volumes (n=58,957)">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={mix.grouped || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis type="number" tick={tickStyle} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <YAxis dataKey="channel" type="category" width={120} tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v.toLocaleString()} (${p.payload.pct}%)`, p.payload.breakdown]} />
                  <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                    {(mix.grouped || []).map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Channel Share" subtitle="Percentage of total volume">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={mix.grouped || []} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="volume" nameKey="channel"
                    label={({ channel, pct }) => `${channel} ${pct}%`} labelLine={false} style={{ fontSize: 10 }}>
                    {(mix.grouped || []).map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* 2C: Monthly Channel Shift */}
          <ChartCard title="Monthly Channel Shift (Post-HC Launch)" subtitle="HC launched Nov 17 \u2014 channel share migration over 4 months">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyArea}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="month" tick={tickStyle} />
                <YAxis tick={tickStyle} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Email" stackId="1" fill="#FF4757" stroke="#FF4757" fillOpacity={0.7} />
                <Area type="monotone" dataKey="Live Chat" stackId="1" fill="#7B61FF" stroke="#7B61FF" fillOpacity={0.7} />
                <Area type="monotone" dataKey="In-App" stackId="1" fill="#7B61FF" stroke="#7B61FF" fillOpacity={0.7} />
                <Area type="monotone" dataKey="Phone" stackId="1" fill="#FFB020" stroke="#FFB020" fillOpacity={0.7} />
                <Area type="monotone" dataKey="L1 Agent" stackId="1" fill="#00D09C" stroke="#00D09C" fillOpacity={0.7} />
                <Area type="monotone" dataKey="Social" stackId="1" fill="#FF6B6B" stroke="#FF6B6B" fillOpacity={0.7} />
              </AreaChart>
            </ResponsiveContainer>
            {/* Shift annotations */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '12px 0' }}>
              {(mix.shiftAnnotations || []).map((a, i) => (
                <div key={i} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', background: `${a.color}15`, border: `1px solid ${a.color}30`, fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: a.color }}>{a.label}</span>
                  {a.note && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{a.note}</div>}
                </div>
              ))}
            </div>
            <InsightBox color="var(--accent-amber)">{mix.shiftInsight}</InsightBox>
          </ChartCard>

          {/* ════════════ SECTION 3: RESOLUTION EFFECTIVENESS ════════════ */}
          <SectionHeader number={3} title="Resolution Effectiveness" subtitle="FCR by channel, by category, and dual-sided effort cost" />

          {/* 3A: FCR by Channel */}
          <ChartCard title="FCR by Channel" subtitle="Sorted worst to best. Red <76%, Amber 76-82%, Green >82%">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={res.fcrByChannel || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="number" domain={[60, 100]} tick={tickStyle} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="channel" type="category" width={140} tick={tickStyle} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v}% FCR (${p.payload.multiTouch.toLocaleString()} multi-touch / ${p.payload.total.toLocaleString()} clusters)`, p.payload.insight]} />
                <Bar dataKey="fcr" radius={[0, 4, 4, 0]}>
                  {(res.fcrByChannel || []).map((d, i) => <Cell key={i} fill={fcrColor(d.fcr)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 3B: FCR by Category */}
          <ChartCard title="FCR by Issue Category" subtitle="Sorted worst to best (min 30 clusters). Red <76%, Amber 76-82%, Green >82%">
            <ResponsiveContainer width="100%" height={460}>
              <BarChart data={res.fcrByCategory || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="number" domain={[40, 100]} tick={tickStyle} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="category" type="category" width={160} tick={{ ...tickStyle, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v}% FCR (${p.payload.multi?.toLocaleString()} multi / ${p.payload.total?.toLocaleString()} total)`, 'FCR']} />
                <Bar dataKey="fcr" radius={[0, 4, 4, 0]}>
                  {(res.fcrByCategory || []).map((d, i) => <Cell key={i} fill={fcrColor(d.fcr)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <InsightBox color="var(--accent-red)">{res.fcrCategoryInsight}</InsightBox>
          </ChartCard>

          {/* 3C: Effort Cost Signals Table */}
          <ChartCard title="Effort Cost Signals" subtitle="Dual-sided view: customer effort AND agent effort per channel">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Channel', 'Volume', 'Customer Effort', 'Agent Effort', 'Close %', 'Rework %', 'Cost Signal'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(res.effortCost || []).map((row, i) => (
                    <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{row.channel}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{row.volume.toLocaleString()}</td>
                      <td style={tdStyle}>
                        <EffortBadge label={row.customerEffort.label} color={row.customerEffort.color} />
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>{row.customerEffort.reason}</div>
                      </td>
                      <td style={tdStyle}>
                        <EffortBadge label={row.agentEffort.label} color={row.agentEffort.color} />
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>{row.agentEffort.reason}</div>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 600, color: row.closeRate >= 95 ? 'var(--accent-green)' : row.closeRate >= 80 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                        {row.closeRate}%
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 600, color: row.reworkRate > 5 ? 'var(--accent-red)' : row.reworkRate > 2 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                        {row.reworkRate}%
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, fontWeight: 500, maxWidth: 200 }}>{row.costSignal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* ════════════ SECTION 4: CHANNEL SWITCHING & MERGED TICKETS ════════════ */}
          <SectionHeader number={4} title="Channel Switching & Merged Tickets" subtitle="User effort patterns, switch flows, and duplicate ticket analysis" />

          {/* 4A: Channel Switching Overview */}
          <div className="grid-3">
            <MetricCard label="Switcher Users" value={sw.overview?.switcherUsers?.toLocaleString()} icon={ArrowRightLeft} color="red" subtitle={`${sw.overview?.switcherPct}% of all users`} />
            <MetricCard label="Switcher Clusters" value={sw.overview?.switcherClusters?.toLocaleString()} icon={Layers} color="red" subtitle={`${sw.overview?.switcherClusterPct}% of all issue clusters`} />
            <MetricCard label="FCR Gap" value={`${sw.overview?.fcrGap}pp`} icon={TrendingUp} color="red" subtitle={`Switchers: ${sw.overview?.fcrSwitchers}% vs Non: ${sw.overview?.fcrNonSwitchers}%`} />
          </div>

          {/* 4B: Top Channel Switch Patterns */}
          <ChartCard title="Top Channel Switch Patterns" subtitle="Most common multi-channel paths for the same issue">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={sw.patterns || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="number" tick={tickStyle} />
                <YAxis dataKey="pattern" type="category" width={250} tick={{ ...tickStyle, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v.toLocaleString()} clusters`, p.payload.interpretation]} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="var(--accent-red)" />
              </BarChart>
            </ResponsiveContainer>
            <InsightBox color="var(--accent-red)">{sw.patternInsight}</InsightBox>
          </ChartCard>

          {/* 4C: Merged Tickets Analysis */}
          <div className="grid-2">
            <ChartCard title="Merge Rate by Channel" subtitle={`${merged.totalMerged?.toLocaleString()} tickets merged (${merged.mergeRate}% rate)`}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={merged.byChannel || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis type="number" tick={tickStyle} tickFormatter={v => `${v}%`} />
                  <YAxis dataKey="channel" type="category" width={120} tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v}% (${p.payload.merged} / ${p.payload.total?.toLocaleString()})`, 'Merge Rate']} />
                  <Bar dataKey="mergeRate" radius={[0, 4, 4, 0]} fill="var(--accent-amber)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Merged Tickets by Category" subtitle="Top 5 categories with most merged tickets">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={merged.byCategory || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis type="number" tick={tickStyle} />
                  <YAxis dataKey="category" type="category" width={160} tick={{ ...tickStyle, fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [v.toLocaleString(), 'Merged Tickets']} />
                  <Bar dataKey="merged" radius={[0, 4, 4, 0]} fill="var(--accent-amber)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Correlations */}
          <ChartCard title="Effort Signal Correlations" subtitle="Overlap between merged tickets, channel switching, and L2 escalation">
            <div className="grid-2">
              {/* Correlation Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Merged + Switched', ...corr.mergedAndSwitched },
                  { label: 'Merged + L2', ...corr.mergedAndL2 },
                  { label: 'Switched + L2', ...corr.switchedAndL2 },
                  { label: 'ALL THREE', ...corr.allThree, highlight: true },
                ].map((c, i) => (
                  <div key={i} style={{
                    padding: '10px 14px', borderRadius: 'var(--radius)',
                    background: c.highlight ? 'rgba(255,71,87,0.08)' : 'var(--bg-card)',
                    border: `1px solid ${c.highlight ? 'rgba(255,71,87,0.3)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: c.highlight ? 'var(--accent-red)' : 'var(--accent-blue)', minWidth: 50 }}>
                      {c.count?.toLocaleString()}
                    </span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{c.insight}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 4D: Venn Diagram (CSS) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Effort Signal Overlap</div>
                <svg viewBox="0 0 400 320" width="100%" style={{ maxWidth: 380 }}>
                  {/* Circle 1: Merged */}
                  <circle cx="160" cy="140" r="90" fill="rgba(255,176,32,0.12)" stroke="#FFB020" strokeWidth="2" />
                  {/* Circle 2: Switch */}
                  <circle cx="240" cy="140" r="110" fill="rgba(255,71,87,0.1)" stroke="#FF4757" strokeWidth="2" />
                  {/* Circle 3: L2 */}
                  <circle cx="200" cy="220" r="85" fill="rgba(123,97,255,0.1)" stroke="#7B61FF" strokeWidth="2" />

                  {/* Labels */}
                  <text x="100" y="100" fill="#FFB020" fontSize="11" fontWeight="700" textAnchor="middle">Merged</text>
                  <text x="100" y="116" fill="#FFB020" fontSize="10" textAnchor="middle">{venn.mergedTotal?.toLocaleString()}</text>
                  <text x="100" y="132" fill="var(--text-muted)" fontSize="9" textAnchor="middle">only: {venn.mergedOnly}</text>

                  <text x="320" y="100" fill="#FF4757" fontSize="11" fontWeight="700" textAnchor="middle">Switch</text>
                  <text x="320" y="116" fill="#FF4757" fontSize="10" textAnchor="middle">{venn.switchTotal?.toLocaleString()}</text>
                  <text x="320" y="132" fill="var(--text-muted)" fontSize="9" textAnchor="middle">only: {venn.switchOnly?.toLocaleString()}</text>

                  <text x="200" y="300" fill="#7B61FF" fontSize="11" fontWeight="700" textAnchor="middle">L2 Escalation</text>
                  <text x="200" y="315" fill="#7B61FF" fontSize="10" textAnchor="middle">{venn.l2Total?.toLocaleString()}</text>

                  {/* Overlap labels */}
                  <text x="195" y="120" fill="var(--text)" fontSize="10" fontWeight="600" textAnchor="middle">{venn.mergedAndSwitch}</text>
                  <text x="148" y="195" fill="var(--text)" fontSize="10" fontWeight="600" textAnchor="middle">{venn.mergedAndL2}</text>
                  <text x="252" y="195" fill="var(--text)" fontSize="10" fontWeight="600" textAnchor="middle">{venn.switchAndL2?.toLocaleString()}</text>

                  {/* Center */}
                  <circle cx="200" cy="170" r="22" fill="rgba(255,71,87,0.25)" stroke="#FF4757" strokeWidth="2" />
                  <text x="200" y="166" fill="#FF4757" fontSize="12" fontWeight="800" textAnchor="middle">{venn.allThree}</text>
                  <text x="200" y="180" fill="var(--text-muted)" fontSize="8" textAnchor="middle">all 3</text>
                </svg>
              </div>
            </div>
            <InsightBox color="var(--accent-red)">{merged.mergedInsight}</InsightBox>
          </ChartCard>

          {/* ════════════ SECTION 5: DEVICE VERIFICATION + RECOMMENDATION ════════════ */}
          <SectionHeader number={5} title="Device Verification Spotlight & Strategic Recommendation" subtitle="The largest single volume driver, and what to do about it" />

          {/* 5A: Device Verification */}
          <div className="grid-2">
            <ChartCard title="Device Verification \u2014 The Volume Driver" subtitle={`${dv.total?.toLocaleString()} tickets (${dv.pctOfAllTickets}% of all volume)`}>
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <MetricCard label="Total DV Tickets" value={dv.total?.toLocaleString()} icon={Smartphone} color="purple" subtitle={`${dv.pctOfAllTickets}% of all tickets`} />
                <MetricCard label="In-App Waiting" value={`${dv.inAppStatus?.waitingOnUser}%`} icon={XCircle} color="red" subtitle="Stuck in 'Waiting on User' forever" />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dv.byOrigin || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis type="number" tick={tickStyle} />
                  <YAxis dataKey="origin" type="category" width={120} tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v.toLocaleString()} (${p.payload.pct}%)`, 'Tickets']} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#7B61FF" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InsightBox color="var(--accent-purple)">{dv.insight}</InsightBox>
              <button onClick={() => setShowDevVer(!showDevVer)} style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                color: 'var(--accent-blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
              }}>
                {showDevVer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showDevVer ? 'Hide' : 'Show'} In-App status breakdown
              </button>
              {showDevVer && (
                <div style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
                    <div><span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{dv.inAppStatus?.waitingOnUser}%</span> Waiting on User</div>
                    <div><span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{dv.inAppStatus?.closed}%</span> Closed</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>{dv.inAppStatus?.note}</div>
                </div>
              )}
            </div>
          </div>

          {/* 5B: THE RECOMMENDATION */}
          <div style={{
            background: 'var(--bg-card)', border: '2px solid rgba(0,208,156,0.3)',
            borderRadius: 'var(--radius)', padding: '24px 28px', marginTop: 16,
            boxShadow: '0 0 20px rgba(0,208,156,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,208,156,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} style={{ color: '#00D09C' }} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#00D09C' }}>Strategic Recommendation</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rec.title}</div>
              </div>
            </div>

            {/* Before/After Flow */}
            <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
              {/* Current Flow */}
              <div style={{ padding: '16px', background: 'rgba(255,71,87,0.04)', border: '1px solid rgba(255,71,87,0.15)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 10 }}>
                  CURRENT FLOW (High Effort)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(rec.currentFlow || []).map((s, i, arr) => (
                    <React.Fragment key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'rgba(255,71,87,0.04)', borderRadius: 4, fontSize: 11 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-red)', fontSize: 10, minWidth: 16 }}>{s.step}</span>
                        <span>{s.label}</span>
                      </div>
                      {i < arr.length - 1 && <ArrowDown size={12} style={{ color: 'var(--text-muted)', opacity: 0.4, marginLeft: 10 }} />}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span>Steps: <strong style={{ color: 'var(--accent-red)' }}>{rec.currentStats?.steps}</strong></span>
                  <span>Effort: <strong style={{ color: 'var(--accent-red)' }}>{rec.currentStats?.effort}</strong></span>
                </div>
              </div>

              {/* Proposed Flow */}
              <div style={{ padding: '16px', background: 'rgba(0,208,156,0.04)', border: '1px solid rgba(0,208,156,0.15)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#00D09C', marginBottom: 10 }}>
                  PROPOSED FLOW (Low Effort)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(rec.proposedFlow || []).map((s, i, arr) => (
                    <React.Fragment key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'rgba(0,208,156,0.04)', borderRadius: 4, fontSize: 11 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00D09C', fontSize: 10, minWidth: 16 }}>{s.step}</span>
                        <span>{s.label}</span>
                      </div>
                      {i < arr.length - 1 && <ArrowDown size={12} style={{ color: 'var(--text-muted)', opacity: 0.4, marginLeft: 10 }} />}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span>Steps: <strong style={{ color: '#00D09C' }}>{rec.proposedStats?.steps}</strong></span>
                  <span>Effort: <strong style={{ color: '#00D09C' }}>{rec.proposedStats?.effort}</strong></span>
                </div>
              </div>
            </div>

            {/* Alert Examples */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>What the System-State Alert Panel Shows:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(rec.alertExamples || []).map((ex, i) => (
                  <div key={i} style={{ padding: '8px 14px', background: 'rgba(0,208,156,0.06)', border: '1px solid rgba(0,208,156,0.15)', borderRadius: 'var(--radius)', fontSize: 12, fontStyle: 'italic' }}>
                    &ldquo;{ex}&rdquo;
                  </div>
                ))}
              </div>
            </div>

            {/* Detectable States */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Detectable States (from backend/admin panel):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(rec.detectableStates || []).map((st, i) => (
                  <div key={i} style={{ padding: '6px 12px', borderRadius: 'var(--radius)', background: 'rgba(0,208,156,0.06)', border: '1px solid rgba(0,208,156,0.12)', fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: '#00D09C' }}>{i + 1}. {st.state}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({st.detail})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Estimate */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Impact Estimate:</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Category', 'Current Volume', 'Deflectable', 'Deflect %', 'Note'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(rec.impactEstimate || []).map((row, i) => (
                      <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{row.category}</td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{row.current.toLocaleString()}</td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00D09C' }}>{row.deflectable.toLocaleString()}</td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{row.deflectPct}%</td>
                        <td style={{ ...tdStyle, fontSize: 11, color: 'var(--text-muted)' }}>{row.note}</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'rgba(0,208,156,0.06)' }}>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>TOTAL DEFLECTABLE</td>
                      <td style={tdStyle}></td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#00D09C', fontSize: 14 }}>~{rec.totalDeflectable?.toLocaleString()}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{rec.totalDeflectPct}%</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#00D09C' }}>~{rec.agentHoursSaved?.toLocaleString()} agent-hours saved/period</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Technical Requirements */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Technical Requirements:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(rec.technicalRequirements || []).map((req_item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11, lineHeight: 1.5 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00D09C', minWidth: 16 }}>{i + 1}.</span>
                    <span style={{ color: 'var(--text-muted)' }}>{req_item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Why This Is Better */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Why This Is Better Than Improving the Bot or Email:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(rec.whyBetter || []).map((w, i) => {
                  const isWinner = w.approach === 'System-state alert';
                  return (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 'var(--radius)',
                      background: isWinner ? 'rgba(0,208,156,0.08)' : 'var(--bg-primary)',
                      border: `1px solid ${isWinner ? 'rgba(0,208,156,0.3)' : 'var(--border)'}`,
                      borderLeft: `3px solid ${isWinner ? '#00D09C' : 'var(--text-muted)'}`,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isWinner ? '#00D09C' : 'var(--text)' }}>{w.approach}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{w.result}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
