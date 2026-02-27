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
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, ScatterChart, Scatter, ZAxis,
  AreaChart, Area, ReferenceLine,
} from 'recharts';
import {
  Star, AlertTriangle, Eye, ThumbsUp, ThumbsDown, BookOpen,
  FileText, Zap, Target, CheckCircle, XCircle, ArrowRight,
  ChevronDown, ChevronUp, Search, RefreshCw, Link2, BarChart3,
  ArrowDown, Shield,
} from 'lucide-react';
import { tooltipStyle, tickStyle, gridStroke } from '../../utils/chartConfig';
import { thCompact as thStyle, tdCompact as tdStyle } from '../../utils/tableStyles';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'articles', label: 'Article Satisfaction' },
  { key: 'quality', label: 'Quality Scores' },
  { key: 'signals', label: 'Channel Signals' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'ces', label: 'CES \u2194 CSAT' },
  { key: 'recs', label: 'Recommendations' },
];

/* ── Helpers ── */
function InsightBox({ children, color = 'var(--accent-blue)' }) {
  return (
    <div style={{ borderLeft: `4px solid ${color}`, background: 'rgba(123,97,255,0.04)', padding: '12px 16px', borderRadius: '0 var(--radius) var(--radius) 0', fontSize: 12, lineHeight: 1.6, fontStyle: 'italic', color: 'var(--text)', marginBottom: 16 }}>
      {children}
    </div>
  );
}

function StatusDot({ status }) {
  const colors = { broken: 'var(--accent-red)', partial: 'var(--accent-amber)', working: 'var(--accent-green)', critical: 'var(--accent-red)', low: 'var(--accent-red)', mixed: 'var(--accent-amber)', acceptable: 'var(--accent-amber)', high: 'var(--accent-green)', good: 'var(--accent-green)' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[status] || 'var(--text-muted)', marginRight: 6 }} />;
}

function scoreColor(score) {
  if (score < 5.5) return 'var(--accent-red)';
  if (score < 7.0) return 'var(--accent-amber)';
  return 'var(--accent-green)';
}

function ScoreBar({ score, max = 10, target }) {
  const pct = (score / max) * 100;
  const tPct = target ? (target / max) * 100 : null;
  return (
    <div style={{ position: 'relative', height: 16, background: 'rgba(150,144,176,0.1)', borderRadius: 4, overflow: 'visible' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: scoreColor(score), borderRadius: 4, transition: 'width 0.3s' }} />
      {tPct && <div style={{ position: 'absolute', left: `${tPct}%`, top: -2, bottom: -2, width: 2, background: 'var(--text-muted)', borderRadius: 1 }} />}
    </div>
  );
}

function SignalBadge({ signal }) {
  const cfg = {
    green: { bg: 'rgba(0,208,156,0.1)', border: 'rgba(0,208,156,0.3)', color: '#00D09C', icon: '\uD83D\uDFE2' },
    amber: { bg: 'rgba(255,176,32,0.1)', border: 'rgba(255,176,32,0.3)', color: '#FFB020', icon: '\uD83D\uDFE1' },
    red: { bg: 'rgba(255,71,87,0.1)', border: 'rgba(255,71,87,0.3)', color: '#FF4757', icon: '\uD83D\uDD34' },
  };
  const c = cfg[signal] || cfg.amber;
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: c.bg, border: `1px solid ${c.border}`, color: c.color, fontSize: 10, fontWeight: 600 }}>{c.icon}</span>;
}


/* ══════════════════════════════════════════════════════════════ */

export default function CSATAnalysis() {
  const { data, loading, error, refetch } = useApi('/api/csat-analysis');
  const [tab, setTab] = useState('overview');
  const [showSamples, setShowSamples] = useState(false);

  const ov = data?.overview || {};
  const art = data?.articleSatisfaction || {};
  const qual = data?.qualityScores || {};
  const meth = qual.methodology || {};
  const sig = data?.channelSignals || {};
  const drv = data?.drivers || {};
  const ces = data?.cesHypothesis || {};
  const recs = data?.recommendations || [];
  const gaps = data?.gapInventory || {};

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="page-title">CSAT Analysis</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Source: Salesforce + Knowledge Base &bull; 58,957 tickets | 3,193 article votes | 37,759 surveys
          </div>
        </div>
        {data && <DataSourceLabel source={data._source || 'salesforce'} updated={data._updated} />}
      </div>

      {loading && <LoadingSpinner message="Loading CSAT data..." />}
      {error && <ErrorBoundaryCard error={error} onRetry={refetch} />}

      {data && (
        <>
          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 16, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '10px 16px', fontSize: 12, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? 'var(--accent-blue)' : 'var(--text-muted)',
                background: 'transparent', border: 'none', borderBottom: tab === t.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ════════════ TAB 1: OVERVIEW ════════════ */}
          {tab === 'overview' && (
            <>
              <AlertBanner type="error">{ov.hero}</AlertBanner>

              <div className="grid-4">
                <MetricCard label="Overall Response Rate" value={`${ov.surveyStats?.overallRate}%`} icon={Eye} color="amber" subtitle={`${ov.surveyStats?.overallResponses?.toLocaleString()} / ${ov.surveyStats?.overallSent?.toLocaleString()}`} />
                <MetricCard label="Chatbot CSAT" value={`${ov.surveyStats?.chatbotRate}%`} icon={XCircle} color="red" subtitle={`${ov.surveyStats?.chatbotSent?.toLocaleString()} surveys, 0 responses`} />
                <MetricCard label="EmailCase CSAT" value={`${ov.surveyStats?.emailCaseRate}%`} icon={AlertTriangle} color="red" subtitle={`${ov.surveyStats?.emailCaseResponses} / ${ov.surveyStats?.emailCaseSent?.toLocaleString()}`} />
                <MetricCard label="Linkable to SF" value={ov.surveyStats?.linkableCases?.toLocaleString()} icon={CheckCircle} color="green" subtitle="Responded cases joinable to tickets" />
              </div>

              {/* Survey Response Rate Chart */}
              <ChartCard title="Survey Response Rate by Channel" subtitle="Bars colored by rate: green >10%, amber 2-10%, red <2%">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ov.channelSurvey || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" tick={tickStyle} />
                    <YAxis dataKey="channel" type="category" width={140} tick={tickStyle} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v.toLocaleString()} responses`, p.payload.note]} />
                    <Bar dataKey="responses" radius={[0, 4, 4, 0]}>
                      {(ov.channelSurvey || []).map((c, i) => {
                        const rate = c.rate;
                        const color = rate === 0 ? 'var(--accent-red)' : rate !== null && rate < 2 ? 'var(--accent-red)' : rate !== null && rate < 10 ? 'var(--accent-amber)' : 'var(--accent-green)';
                        return <Cell key={i} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Instrumentation Gap */}
              <ChartCard title="Instrumentation Gap Matrix" subtitle="CSAT measurement method and status by channel">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        {['Channel', 'Method', 'Scale', 'Response Rate', 'Status', 'Issue'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(ov.instrumentationGap || []).map((r, i) => (
                        <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{r.channel}</td>
                          <td style={tdStyle}>{r.method}</td>
                          <td style={tdStyle}>{r.scale}</td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{r.responseRate}</td>
                          <td style={tdStyle}><StatusDot status={r.status} />{r.status === 'broken' ? 'BROKEN' : r.status === 'partial' ? 'Partial' : 'Working'}</td>
                          <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: 11 }}>{r.bug || '\u2014'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>

              {/* Paradox */}
              <ChartCard title="The Measurement Paradox" subtitle={ov.paradox?.insight}>
                <div className="grid-2">
                  <div style={{ padding: 16, background: 'rgba(0,208,156,0.06)', borderRadius: 'var(--radius)', border: '1px solid rgba(0,208,156,0.15)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-green)', marginBottom: 12 }}>What We Report</div>
                    {(ov.paradox?.reported || []).map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', minWidth: 60 }}>{m.value}%</div>
                        <div style={{ fontSize: 12 }}>{m.metric}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 16, background: 'rgba(255,71,87,0.06)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,71,87,0.15)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-red)', marginBottom: 12 }}>What Customers Experience</div>
                    {(ov.paradox?.experienced || []).map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', minWidth: 60 }}>{m.value}{typeof m.value === 'number' && m.value < 100 ? '%' : ''}</div>
                        <div style={{ fontSize: 12 }}>{m.metric}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            </>
          )}

          {/* ════════════ TAB 2: ARTICLE SATISFACTION ════════════ */}
          {tab === 'articles' && (
            <>
              <InsightBox>Knowledge Base is the one channel with working satisfaction measurement. 3,193 votes across 369 articles give us actionable quality signals — but 64% of viewed articles have zero feedback.</InsightBox>

              <div className="grid-3">
                <MetricCard label="Total Votes" value={art.overall?.totalVotes?.toLocaleString()} icon={ThumbsUp} color="blue" subtitle={`Across ${art.overall?.totalArticles} articles`} />
                <MetricCard label="Upvote Rate" value={`${art.overall?.upvoteRate}%`} icon={Star} color="green" subtitle={`${art.overall?.upvotes?.toLocaleString()} up / ${art.overall?.downvotes} down`} />
                <MetricCard label="Zero Votes" value={`${art.overall?.zeroVotePct}%`} icon={AlertTriangle} color="red" subtitle="Of viewed articles have NO feedback" />
              </div>

              {/* Monthly Trend */}
              <ChartCard title="Monthly Upvote Trend" subtitle="Upvotes (green) vs Downvotes (red), with % positive line">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={(art.monthlyTrend || []).map(m => ({ ...m, monthLabel: m.month.replace('2025-', '').replace('2026-', "'26-") }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="monthLabel" tick={tickStyle} />
                    <YAxis yAxisId="left" tick={tickStyle} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={tickStyle} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area yAxisId="left" type="monotone" dataKey="up" name="Upvotes" fill="var(--accent-green)" fillOpacity={0.2} stroke="var(--accent-green)" strokeWidth={2} />
                    <Area yAxisId="left" type="monotone" dataKey="down" name="Downvotes" fill="var(--accent-red)" fillOpacity={0.2} stroke="var(--accent-red)" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="positivePct" name="% Positive" stroke="var(--accent-blue)" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <InsightBox color="var(--accent-amber)">Sep 2025 dip to 56% positive — coincides with HC launch preparation changes.</InsightBox>
              </ChartCard>

              {/* Top Box / Bottom Box */}
              <div className="grid-2">
                <ChartCard title="Top Box \u2014 Highest Satisfaction" subtitle="Articles with min 5 votes, sorted by upvote %">
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead><tr><th style={thStyle}>Article</th><th style={{ ...thStyle, textAlign: 'right' }}>Upvote %</th><th style={{ ...thStyle, textAlign: 'right' }}>Votes</th></tr></thead>
                      <tbody>
                        {(art.topBox || []).map((a, i) => (
                          <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                            <td style={{ ...tdStyle, maxWidth: 250 }}>{a.title}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{a.upPct}%</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{a.votes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <InsightBox color="var(--accent-green)">{art.topBoxInsight}</InsightBox>
                </ChartCard>

                <ChartCard title="Bottom Box \u2014 Lowest Satisfaction" subtitle="Articles with min 5 votes, sorted by downvote %">
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead><tr><th style={thStyle}>Article</th><th style={{ ...thStyle, textAlign: 'right' }}>Downvote %</th><th style={{ ...thStyle, textAlign: 'right' }}>Votes</th></tr></thead>
                      <tbody>
                        {(art.bottomBox || []).map((a, i) => (
                          <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                            <td style={{ ...tdStyle, maxWidth: 250 }}>{a.title}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--accent-red)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{a.downPct}%</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{a.votes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <InsightBox color="var(--accent-red)">{art.bottomBoxInsight}</InsightBox>
                </ChartCard>
              </div>

              {/* Quadrant Scatter */}
              <ChartCard title="Satisfaction Drivers \u2014 Volume vs Quality" subtitle="Quadrants: Protect (high vol, high sat), Fix Urgently (high vol, low sat), Leverage (low vol, high sat), Rewrite (low vol, low sat)">
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" dataKey="votes" name="Votes" tick={tickStyle} label={{ value: 'Vote Volume', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis type="number" dataKey="positivePct" name="Positive %" domain={[0, 100]} tick={tickStyle} label={{ value: 'Satisfaction %', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }} />
                    <ZAxis range={[60, 200]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [n === 'Votes' ? v : `${v}%`, n]} labelFormatter={(_, payload) => payload?.[0]?.payload?.title || ''} />
                    <ReferenceLine y={70} stroke="var(--text-muted)" strokeDasharray="4 4" />
                    <ReferenceLine x={50} stroke="var(--text-muted)" strokeDasharray="4 4" />
                    <Scatter data={(art.quadrant || []).filter(d => d.quadrant === 'protect')} fill="var(--accent-green)" name="Protect" />
                    <Scatter data={(art.quadrant || []).filter(d => d.quadrant === 'fix')} fill="var(--accent-amber)" name="Fix Urgently" />
                    <Scatter data={(art.quadrant || []).filter(d => d.quadrant === 'leverage')} fill="var(--accent-blue)" name="Leverage" />
                    <Scatter data={(art.quadrant || []).filter(d => d.quadrant === 'rewrite')} fill="var(--accent-red)" name="Rewrite/Remove" />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}

          {/* ════════════ TAB 3: QUALITY SCORES ════════════ */}
          {tab === 'quality' && (
            <>
              {/* ── Methodology Explainer (OPEN by default) ── */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>
                  Article Quality Assessment: Methodology
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: 20 }}>
                  {meth.summary}
                </div>

                {/* Dimension Definition Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                  {(meth.dimensions || []).map((dim, i) => {
                    const borderColors = { meets: '#00D09C', borderline: '#FFB020', below: '#FFB020', critical: '#FF4757' };
                    const statusIcons = { meets: '\u2705', borderline: '\uD83D\uDFE1', below: '\uD83D\uDFE1', critical: '\uD83D\uDD34' };
                    return (
                      <div key={i} style={{
                        background: 'var(--bg-primary)', border: '1px solid var(--border)',
                        borderLeft: `4px solid ${borderColors[dim.status] || '#9690B0'}`,
                        borderRadius: 'var(--radius)', padding: '14px 16px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{dim.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: borderColors[dim.status] }}>{dim.avg.toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: borderColors[dim.status], marginBottom: 10 }}>
                          {statusIcons[dim.status]} {dim.statusLabel}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.6, marginBottom: 10 }}>
                          {dim.description}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>
                          {dim.scoring}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.5, padding: '8px 10px', background: 'rgba(150,144,176,0.06)', borderRadius: 4 }}>
                          <span style={{ fontWeight: 600 }}>{dim.status === 'meets' ? 'Why it\'s high: ' : 'Key gap: '}</span>
                          {dim.keyGap}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Core Insight */}
                <div style={{
                  background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)',
                  borderLeft: '4px solid var(--accent-red)', borderRadius: 'var(--radius)',
                  padding: '16px 20px', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 6 }}>
                    The Defining Finding
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text)' }}>
                    {meth.coreInsight}
                  </div>
                </div>

                {/* Sample Evaluations (collapsible) */}
                <button onClick={() => setShowSamples(!showSamples)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                  color: 'var(--accent-blue)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
                }}>
                  {showSamples ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showSamples ? 'Hide' : 'Show'} Sample Evaluations
                </button>
                {showSamples && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                    {(meth.sampleEvaluations || []).map((sample, i) => (
                      <div key={i} style={{
                        padding: '14px 18px', borderRadius: 'var(--radius)',
                        background: sample.type === 'high' ? 'rgba(0,208,156,0.04)' : 'rgba(255,71,87,0.04)',
                        border: `1px solid ${sample.type === 'high' ? 'rgba(0,208,156,0.15)' : 'rgba(255,71,87,0.15)'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div>
                            <Badge variant={sample.type === 'high' ? 'success' : 'error'}>{sample.type === 'high' ? 'High-scoring' : 'Low-scoring'}</Badge>
                            <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{sample.title}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>({sample.category})</span>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: sample.type === 'high' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {sample.overallScore}/10
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 11, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                          <span>Accuracy: {sample.scores.accuracy}</span>
                          <span>Clarity: {sample.scores.clarity}</span>
                          <span>Completeness: {sample.scores.completeness}</span>
                          <span>Usefulness: {sample.scores.usefulness}</span>
                        </div>
                        {sample.negativeVotePct && (
                          <div style={{ fontSize: 11, color: 'var(--accent-red)', marginBottom: 6 }}>{sample.negativeVotePct}% negative user votes</div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>Evaluator: </span>{sample.reasoning}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 600 }}>Improvement: </span>{sample.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Existing quality content */}
              <InsightBox>{qual.overallInsight}</InsightBox>

              {/* Quality dimension gauges */}
              <div className="grid-5">
                {(qual.overall || []).map((d, i) => {
                  const color = d.status === 'meets' ? 'green' : d.status === 'critical' ? 'red' : 'amber';
                  return (
                    <MetricCard key={i} label={d.dimension} value={d.score.toFixed(2)} icon={Target} color={color}
                      subtitle={`Target: ${d.target} ${d.status === 'meets' ? '(met)' : d.status === 'critical' ? '(CRITICAL)' : '(below)'}`} />
                  );
                })}
              </div>

              {/* By Category */}
              <ChartCard title="Quality by Category" subtitle="Sorted worst-first. Red <5.5, Amber 5.5-7.0, Green >7.0">
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={qual.byCategory || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" domain={[0, 10]} tick={tickStyle} />
                    <YAxis dataKey="category" type="category" width={150} tick={tickStyle} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v.toFixed(2)} (${p.payload.n} articles)`, 'Score']} />
                    <ReferenceLine x={7.0} stroke="var(--text-muted)" strokeDasharray="4 4" label={{ value: 'Target', fill: 'var(--text-muted)', fontSize: 9 }} />
                    <Bar dataKey="overall" radius={[0, 4, 4, 0]}>
                      {(qual.byCategory || []).map((c, i) => (
                        <Cell key={i} fill={scoreColor(c.overall)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <InsightBox color="var(--accent-red)">{qual.categoryInsight}</InsightBox>
              </ChartCard>

              <div className="grid-2">
                {/* By Language */}
                <ChartCard title="Quality by Language" subtitle="Average score comparison">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
                    {(qual.byLanguage || []).map((l, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                          <span>{l.language} ({l.articles} articles)</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: scoreColor(l.score) }}>{l.score.toFixed(2)} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({l.gap > 0 ? '+' : ''}{l.gap.toFixed(2)} vs avg)</span></span>
                        </div>
                        <ScoreBar score={l.score} target={6.62} />
                      </div>
                    ))}
                  </div>
                </ChartCard>

                {/* Score Distribution */}
                <ChartCard title="Score Distribution" subtitle="175 articles scored across all dimensions">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={qual.scoreDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="bucket" tick={tickStyle} />
                      <YAxis tick={tickStyle} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v} articles (${p.payload.pct}%)`, 'Count']} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {(qual.scoreDistribution || []).map((d, i) => (
                          <Cell key={i} fill={d.zone === 'red' ? 'var(--accent-red)' : d.zone === 'amber' ? 'var(--accent-amber)' : 'var(--accent-green)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </>
          )}

          {/* ════════════ TAB 4: CHANNEL SIGNALS ════════════ */}
          {tab === 'signals' && (
            <>
              <InsightBox>Since direct CSAT is broken for most channels, we use behavioral proxy signals (L2 escalation, resolution rate, channel switching) to infer satisfaction.</InsightBox>

              {/* Proxy Dashboard */}
              <ChartCard title="Channel Satisfaction Proxy Dashboard" subtitle="Composite behavioral signals per channel">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>{['Channel', 'Direct CSAT', 'L2 Escalation', 'Resolution Rate', 'Repeat Contact', 'Signal'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {(sig.proxyDashboard || []).map((r, i) => (
                        <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{r.channel}</td>
                          <td style={tdStyle}>{r.directCSAT}</td>
                          <td style={tdStyle}>{r.l2Rate}</td>
                          <td style={tdStyle}>{r.resolutionRate}</td>
                          <td style={tdStyle}>{r.repeatContact}</td>
                          <td style={tdStyle}><StatusDot status={r.signal} /><span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>{r.signal}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>

              {/* L2 Escalation */}
              <ChartCard title="L2 Escalation as Dissatisfaction Proxy" subtitle="Higher = more dissatisfied customers">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sig.l2Escalation || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" tick={tickStyle} tickFormatter={v => `${v}%`} />
                    <YAxis dataKey="channel" type="category" width={100} tick={tickStyle} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${v}% (${p.payload.escalated?.toLocaleString()} / ${p.payload.total?.toLocaleString()})`, 'L2 Rate']} />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                      {(sig.l2Escalation || []).map((d, i) => (
                        <Cell key={i} fill={d.rate > 5 ? 'var(--accent-red)' : d.rate > 1 ? 'var(--accent-amber)' : 'var(--accent-green)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <InsightBox color="var(--accent-red)">{sig.l2Insight}</InsightBox>
              </ChartCard>

              {/* Channel Switching */}
              <ChartCard title="Channel Switching as Frustration Signal" subtitle="Each switch = repeated effort, lost context">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
                  {(sig.channelSwitching || []).map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,71,87,0.04)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,71,87,0.1)' }}>
                      <ArrowRight size={16} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.pattern}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.interpretation}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--accent-red)' }}>{s.volume.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </ChartCard>

              {/* Resolution Status */}
              <ChartCard title="Resolution Status by Channel" subtitle="Stacked bar: % of cases in each state. Note In-App 49.3% Waiting on User.">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={sig.resolutionStatus || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" domain={[0, 100]} tick={tickStyle} tickFormatter={v => `${v}%`} />
                    <YAxis dataKey="channel" type="category" width={100} tick={tickStyle} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="closed" name="Closed" stackId="a" fill="var(--accent-green)" />
                    <Bar dataKey="l2" name="L2 Escalated" stackId="a" fill="var(--accent-red)" />
                    <Bar dataKey="waiting" name="Waiting on User" stackId="a" fill="var(--accent-amber)" />
                    <Bar dataKey="merged" name="Merged" stackId="a" fill="var(--accent-blue)" />
                    <Bar dataKey="inactive" name="Inactive" stackId="a" fill="var(--text-muted)" />
                    <Bar dataKey="other" name="Other" stackId="a" fill="rgba(150,144,176,0.3)" />
                  </BarChart>
                </ResponsiveContainer>
                <InsightBox color="var(--accent-amber)">In-App has 49.3% "Waiting on User" — these are likely auto-created Device Verification tickets where users never respond.</InsightBox>
              </ChartCard>
            </>
          )}

          {/* ════════════ TAB 5: DRIVERS ════════════ */}
          {tab === 'drivers' && (
            <>
              <InsightBox>Deterministic analysis of what drives satisfaction and dissatisfaction across the CS operation.</InsightBox>

              <div className="grid-2">
                {/* Satisfaction Drivers */}
                <ChartCard title="Top 5 Satisfaction Drivers" style={{ borderTop: '3px solid var(--accent-green)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(drv.satisfaction || []).map((d, i) => (
                      <div key={i} style={{ padding: '10px 14px', background: 'rgba(0,208,156,0.04)', borderRadius: 'var(--radius)', border: '1px solid rgba(0,208,156,0.12)' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-green)', fontSize: 14, minWidth: 20 }}>{d.rank}.</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{d.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{d.detail}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>

                {/* Dissatisfaction Drivers */}
                <ChartCard title="Top 5 Dissatisfaction Drivers" style={{ borderTop: '3px solid var(--accent-red)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(drv.dissatisfaction || []).map((d, i) => (
                      <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,71,87,0.04)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,71,87,0.12)' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-red)', fontSize: 14, minWidth: 20 }}>{d.rank}.</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{d.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{d.detail}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>

              {/* Impact Matrix Scatter */}
              <ChartCard title="Driver Impact Matrix" subtitle="X: Volume affected, Y: Satisfaction impact. Green = positive drivers, Red = negative.">
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis type="number" dataKey="volume" name="Volume" tick={tickStyle} label={{ value: 'Users Affected', position: 'insideBottom', offset: -5, fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis type="number" dataKey="impact" name="Impact" domain={[-100, 100]} tick={tickStyle} label={{ value: 'Satisfaction Impact', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }} />
                    <ZAxis range={[80, 250]} />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, p) => p?.[0]?.payload?.driver || ''} formatter={(v, n) => [n === 'Volume' ? v.toLocaleString() : v, n]} />
                    <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="4 4" />
                    <Scatter data={(drv.impactMatrix || []).filter(d => d.type === 'satisfaction')} fill="var(--accent-green)" name="Satisfaction" />
                    <Scatter data={(drv.impactMatrix || []).filter(d => d.type === 'dissatisfaction')} fill="var(--accent-red)" name="Dissatisfaction" />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Cross-Tab */}
              <ChartCard title="Category x Satisfaction Signal Cross-Tab" subtitle="Combining ticket volume, quality score, upvote rate, L2 rate, and bot failure">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>{['Category', 'Volume', 'Quality', 'Upvote Rate', 'L2 Rate', 'Bot Failure', 'Signal'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {(drv.crossTab || []).map((r, i) => (
                        <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{r.category}</td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{r.volume?.toLocaleString()}</td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', color: r.qualityScore ? scoreColor(r.qualityScore) : 'var(--text-muted)' }}>{r.qualityScore?.toFixed(2) || 'N/A'}</td>
                          <td style={tdStyle}>{r.upvoteRate || 'N/A'}</td>
                          <td style={tdStyle}>{r.l2Rate}</td>
                          <td style={tdStyle}>{r.botFailure}</td>
                          <td style={tdStyle}><StatusDot status={r.signal} /><span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 10 }}>{r.signal}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </>
          )}

          {/* ════════════ TAB 6: CES ↔ CSAT HYPOTHESIS ════════════ */}
          {tab === 'ces' && (
            <>
              {/* Section A: The Hypothesis */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
                  The Hypothesis
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)', marginBottom: 12 }}>
                  {ces.hypothesis}
                </div>
                <div style={{
                  padding: '12px 16px', background: 'rgba(123,97,255,0.06)', borderLeft: '4px solid var(--accent-blue)',
                  borderRadius: '0 var(--radius) var(--radius) 0', fontSize: 12, lineHeight: 1.6, color: 'var(--text)',
                }}>
                  <span style={{ fontWeight: 700 }}>Why this matters: </span>{ces.whyItMatters}
                </div>
              </div>

              {/* Section B: CES Population vs. Satisfaction Signals */}
              <ChartCard title="CES Population vs. Satisfaction Signals" subtitle={`${(ces.totalUsersScored || 0).toLocaleString()} total users scored — behavioral CES tiers crossed with every satisfaction signal`}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {['CES Tier', 'Users', '%', 'Avg Ch', 'L2 Escl Rate', 'Channel Switch', 'Bot Failure', 'Article Downvote Proxy', 'Signal'].map(h => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(ces.populationTable || []).map((row, i) => (
                        <tr key={i} style={{ background: i % 2 ? 'var(--bg-stripe)' : 'transparent' }}>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{row.tier}</td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{row.users.toLocaleString()}</td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{row.pct}</td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>{row.avgChannels}</td>
                          <td style={tdStyle}>{row.l2Rate}</td>
                          <td style={tdStyle}>{row.channelSwitch}</td>
                          <td style={tdStyle}>{row.botFailure}</td>
                          <td style={tdStyle}>{row.articleDownvote}</td>
                          <td style={tdStyle}><SignalBadge signal={row.signal} /> <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>{row.signalLabel}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>

              {/* Section C: The Deterministic Proof Points */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>The Deterministic Proof Points</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  {(ces.proofPoints || []).map((proof, i) => (
                    <div key={i} style={{
                      padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderLeft: '4px solid var(--accent-red)', borderRadius: 'var(--radius)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, color: 'var(--accent-red)', background: 'rgba(255,71,87,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                          PROOF {i + 1}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{proof.title}</span>
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-muted)' }}>{proof.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section D: The Feedback Loop */}
              <ChartCard title="The Effort-Dissatisfaction Loop" subtitle={ces.feedbackLoopLabel}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
                  {(ces.feedbackLoop || []).map((step, i, arr) => (
                    <React.Fragment key={i}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 14, width: '100%', maxWidth: 500,
                        padding: '10px 16px', borderRadius: 'var(--radius)',
                        background: i === 0 || i === arr.length - 1 ? 'rgba(255,71,87,0.08)' : i === 7 ? 'rgba(255,71,87,0.12)' : 'var(--bg-card)',
                        border: `1px solid ${i === 7 ? 'rgba(255,71,87,0.3)' : 'var(--border)'}`,
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: i <= 2 ? 'var(--accent-amber)' : i <= 6 ? 'var(--accent-red)' : 'rgba(150,144,176,0.3)',
                          color: '#fff', fontSize: 11, fontWeight: 700,
                        }}>
                          {step.step}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{step.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{step.detail}</div>
                        </div>
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
                          <ArrowDown size={16} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                  {/* Loop-back arrow */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
                    padding: '8px 16px', background: 'rgba(255,71,87,0.06)', borderRadius: 'var(--radius)',
                    border: '1px dashed rgba(255,71,87,0.3)', width: '100%', maxWidth: 500, justifyContent: 'center',
                  }}>
                    <RefreshCw size={14} style={{ color: 'var(--accent-red)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-red)' }}>LOOP BACK TO STEP 1 \u2014 Bad Article Quality</span>
                  </div>
                </div>
              </ChartCard>

              {/* Section E: So What? */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>So What? \u2014 Action Implications</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(ces.actions || []).map((action, i) => (
                    <div key={i} style={{
                      padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderLeft: '4px solid var(--accent-blue)', borderRadius: 'var(--radius)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, color: 'var(--accent-blue)', background: 'rgba(123,97,255,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                          ACTION {i + 1}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{action.title}</span>
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-muted)' }}>{action.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ════════════ TAB 7: RECOMMENDATIONS ════════════ */}
          {tab === 'recs' && (
            <>
              <InsightBox>Priority actions to fix CSAT measurement and improve customer satisfaction.</InsightBox>

              {/* Action Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {recs.map((r, i) => {
                  const isP0 = r.priority === 'P0';
                  const isP1 = r.priority === 'P1';
                  const borderColor = isP0 ? 'var(--accent-red)' : isP1 ? 'var(--accent-amber)' : 'var(--accent-blue)';
                  const bgColor = isP0 ? 'rgba(255,71,87,0.04)' : isP1 ? 'rgba(255,176,32,0.04)' : 'rgba(123,97,255,0.04)';
                  return (
                    <div key={i} style={{ padding: '16px 20px', background: bgColor, borderLeft: `4px solid ${borderColor}`, borderRadius: '0 var(--radius) var(--radius) 0', border: `1px solid ${borderColor}20`, borderLeftWidth: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <Badge variant={isP0 ? 'error' : isP1 ? 'warning' : 'info'}>{r.priority}</Badge>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{r.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{r.detail}</div>
                    </div>
                  );
                })}
              </div>

              {/* ── Categorized Gap Inventory ── */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Gap Inventory</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Categorized gaps between current state and full CSAT measurement capability</div>

                {/* Summary counts */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                  {(gaps.categories || []).map((cat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius)', background: `${cat.color}12`, border: `1px solid ${cat.color}30` }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: cat.color }}>{cat.label}: {cat.gaps.length}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius)', background: 'rgba(150,144,176,0.08)', border: '1px solid rgba(150,144,176,0.2)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Total: {gaps.summary?.total || 15}</span>
                  </div>
                </div>

                {/* Gap category cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(gaps.categories || []).map((cat, ci) => (
                    <div key={ci}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{cat.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cat.sublabel}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4 }}>
                        {cat.gaps.map((gap, gi) => (
                          <div key={gi} style={{
                            padding: '10px 16px', borderLeft: `3px solid ${cat.color}`, borderRadius: '0 var(--radius) var(--radius) 0',
                            background: `${cat.color}06`, border: `1px solid ${cat.color}15`,
                          }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, color: cat.color, minWidth: 20 }}>#{gap.id}</span>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{gap.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>{gap.detail}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
