import React, { useState, useRef, useEffect, useMemo } from 'react';
import ChartCard from '../../components/ChartCard';
import TabBar from '../../components/TabBar';
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, PieChart, Pie
} from 'recharts';
import {
  Mail, TrendingUp, Clock, Target, AlertTriangle,
  CheckCircle, XCircle, ArrowRight, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { emailData } from '../../data/emailData';

// ── InsightCallout ──
function InsightCallout({ level = 'info', children }) {
  const styles = {
    critical: { bg: 'rgba(255,71,87,0.1)', border: 'var(--accent-red)', icon: AlertTriangle, color: 'var(--accent-red)' },
    warning:  { bg: 'rgba(255,176,32,0.1)', border: 'var(--accent-amber)', icon: AlertTriangle, color: 'var(--accent-amber)' },
    info:     { bg: 'rgba(123,97,255,0.1)',  border: 'var(--accent-blue)', icon: Info, color: 'var(--accent-blue)' },
    good:     { bg: 'rgba(0,208,156,0.1)',  border: 'var(--accent-green)', icon: CheckCircle, color: 'var(--accent-green)' },
  };
  const s = styles[level] || styles.info;
  const Icon = s.icon;
  return (
    <div style={{ background: s.bg, borderLeft: `4px solid ${s.border}`, borderRadius: 8, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <Icon size={18} style={{ color: s.color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)' }}>{children}</div>
    </div>
  );
}

// ── Verdict Pill ──
function VerdictPill({ verdict }) {
  const def = emailData.verdictDefs[verdict];
  if (!def) return <span>{verdict}</span>;
  return <span className="verdict-tag" style={{ background: def.bg, color: def.color }}>{def.label}</span>;
}

// ── Effort Badge ──
function EffortBadge({ level }) {
  const cls = (level || '').toLowerCase().replace(/\s/g, '');
  return <span className={`effort-badge ${cls}`}>{level}</span>;
}

// ── Score Cell ──
function ScoreCell({ score }) {
  return <span className={`score-cell score-${score}`}>{score}</span>;
}

// ── Sortable hook ──
function useSortable(data, defaultKey, defaultDir = 'desc') {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);
  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [data, sortKey, sortDir]);
  const toggleSort = (key) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  const SortIcon = ({ col }) => {
    if (col !== sortKey) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} style={{ marginLeft: 4 }} /> : <ChevronDown size={12} style={{ marginLeft: 4 }} />;
  };
  return { sorted, toggleSort, SortIcon, sortKey };
}

// ── SortHeader ──
function SortHeader({ col, label, sortable, align }) {
  return (
    <th
      style={{ padding: '10px 12px', textAlign: align || 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 1 }}
      onClick={() => sortable.toggleSort(col)}
    >
      {label}<sortable.SortIcon col={col} />
    </th>
  );
}

// ════════════════════════════════════════════════════
// HERO BANNER — always visible
// ════════════════════════════════════════════════════
function HeroBanner() {
  const { hero } = emailData;
  const iconMap = { mail: Mail, 'trending-up': TrendingUp, clock: Clock, target: Target };
  return (
    <div className="email-hero">
      <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'rgba(248,250,252,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Intelligence</div>
      <h1>{hero.title}</h1>
      <div style={{ color: '#9690B0', fontSize: 16, marginBottom: 8 }}>{hero.subtitle}</div>
      <div className="tagline">{hero.tagline}</div>
      <div className="hero-metrics">
        {hero.metrics.map((m, i) => {
          const Icon = iconMap[m.icon] || Mail;
          return (
            <div key={i} className={`metric-card ${m.status || ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon size={16} style={{ color: m.status === 'critical' ? '#FF4757' : m.status === 'warning' ? '#FFB020' : '#9690B0' }} />
                <span className="label">{m.label}</span>
              </div>
              <div className="value">{m.value}</div>
              <div className="subtext">{m.subtext}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// TAB 1: Trend & Workload
// ════════════════════════════════════════════════════
function TrendWorkloadTab() {
  const { monthlyTrend, prePostHC, channelMix } = emailData;
  const preData = [
    { name: 'Email', value: prePostHC.before.email, color: '#FF4757' },
    { name: 'Live Chat', value: prePostHC.before.liveChat, color: '#FFB020' },
    { name: 'Phone', value: prePostHC.before.phone, color: '#7B61FF' },
    { name: 'Bot', value: prePostHC.before.bot, color: '#7B61FF' },
  ].filter(d => d.value > 0);
  const postData = [
    { name: 'Email + EmailCase', value: prePostHC.after.email, color: '#FF4757' },
    { name: 'Live Chat', value: prePostHC.after.liveChat, color: '#FFB020' },
    { name: 'Phone', value: prePostHC.after.phone, color: '#7B61FF' },
    { name: 'Bot', value: prePostHC.after.bot, color: '#7B61FF' },
  ].filter(d => d.value > 0);

  return (
    <div className="section-gap">
      <ChartCard title="Monthly Email Volume vs Share of Total" subtitle="Jul 2025 \u2013 Jan 2026 \u2014 Email grew +48% after Help Center launch">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} label={{ value: 'Email Volume', angle: -90, position: 'insideLeft', fill: 'var(--chart-tick)', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 60]} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} label={{ value: 'Email %', angle: 90, position: 'insideRight', fill: 'var(--chart-tick)', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }} />
            <ReferenceLine x="Nov 2025" yAxisId="left" stroke="#9690B0" strokeDasharray="6 4" label={{ value: 'HC Launch', position: 'top', fill: '#9690B0', fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="email" fill="#FF4757" radius={[4, 4, 0, 0]} name="Email Volume" />
            <Line yAxisId="right" type="monotone" dataKey="emailPct" stroke="#7B61FF" strokeWidth={2} dot={{ r: 4, fill: '#7B61FF' }} name="Email %" />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightCallout level="critical">
        Email grew +48% after Help Center launch. Monthly volume rose from ~4,200 to ~7,100. The Help Center added a channel layer without reducing email demand.
      </InsightCallout>

      <div className="grid-2">
        <ChartCard title="Channel Share: Pre-HC vs Post-HC" subtitle="Post-HC 'Email' = Email + EmailCase (SF workflow relabeled)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '12px 0' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Pre-HC (Before Nov 17) — Origin: "Email"</div>
              <div className="mini-stacked-bar" style={{ height: 28, width: '100%', borderRadius: 6 }}>
                {preData.map((d, i) => (
                  <div key={i} className="mini-bar-segment" style={{ width: `${d.value}%`, background: d.color, position: 'relative' }} title={`${d.name}: ${d.value}%`}>
                    {d.value >= 10 && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d.value}%</span>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Post-HC (After Nov 17) — Origin: "EmailCase"</div>
              <div className="mini-stacked-bar" style={{ height: 28, width: '100%', borderRadius: 6 }}>
                {postData.map((d, i) => (
                  <div key={i} className="mini-bar-segment" style={{ width: `${d.value}%`, background: d.color, position: 'relative' }} title={`${d.name}: ${d.value}%`}>
                    {d.value >= 10 && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d.value}%</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11 }}>
              {['Email / EmailCase', 'Live Chat', 'Phone', 'Bot'].map((name, i) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: ['#FF4757','#FFB020','#7B61FF','#7B61FF'][i] }} />
                  <span style={{ color: 'var(--text-muted)' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Channel Volume & Trend" subtitle="90-day volume by channel">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Channel', 'Volume', '% of Total', 'Trend'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {channelMix.channels.map((ch, i) => (
                  <tr key={i} style={ch.name === 'Email' ? { background: 'rgba(255,71,87,0.08)' } : {}}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: ch.name === 'Email' ? 700 : 400 }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: ch.color, marginRight: 8 }} />
                      {ch.name}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>{ch.volume.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{ch.pct}%</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', color: ch.trend.includes('+') ? 'var(--accent-red)' : 'var(--text-muted)' }}>{ch.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      <InsightCallout level="warning">{prePostHC.insight}</InsightCallout>
    </div>
  );
}

// ════════════════════════════════════════════════════
// TAB 2: The Effort Problem
// ════════════════════════════════════════════════════
function EffortProblemTab() {
  const { customerEffort, agentEffort } = emailData;
  const maxCES = 12;

  // Ceremony donut data
  const ceremonyData = [
    { name: 'Ceremony', value: agentEffort.overall.ceremonyRate, fill: '#FF4757' },
    { name: 'Productive', value: agentEffort.overall.productiveRate, fill: '#00D09C' },
  ];

  // Agent action effort colors
  const effortColor = { LOW: '#00D09C', MEDIUM: '#FFB020', HIGH: '#FF4757', ZERO: '#9690B0' };

  return (
    <div className="section-gap">
      {/* ── SECTION 3: Customer Effort Lens ── */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Customer Effort Lens</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>How hard does the customer work to get a resolution?</div>

      {/* 3A: Effort Comparison Ladder */}
      <ChartCard title="Customer Effort by Resolution Path" subtitle="Each row represents a resolution path \u2014 wider bar = more effort required">
        <div className="effort-ladder">
          {customerEffort.channelComparison.map((row, i) => (
            <div key={i} className="effort-rung" style={{ borderColor: `${row.color}30` }}>
              <div className="channel-path" style={{ color: row.color }}>{row.channel}</div>
              <div className="metric-cell"><div className="value">{row.channelsTouched}</div><div className="label">Channels</div></div>
              <div className="metric-cell"><div className="value">{row.timesExplained}</div><div className="label">Re-explain</div></div>
              <div className="metric-cell"><div className="value" style={{ fontSize: 13 }}>{row.avgResolution}</div><div className="label">Resolution</div></div>
              <div className="effort-bar-container">
                <div className="effort-bar-fill" style={{ width: `${(row.effortScore / maxCES) * 100}%`, background: row.color }}>
                  CES {row.effortScore}
                </div>
              </div>
              <div className="effort-score-badge" style={{ background: row.color }}>{row.effortScore}</div>
            </div>
          ))}
        </div>

        {/* CES Scale Legend */}
        <div className="ces-scale">
          {customerEffort.effortScoreExplainer.scale.map((s, i) => (
            <div key={i} className="ces-scale-item" style={{ background: `${s.color}15`, color: s.color }}>
              <span style={{ fontWeight: 700 }}>{s.range}</span> {s.label}: {s.meaning}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
          Formula: {customerEffort.effortScoreExplainer.formula}
        </div>
      </ChartCard>

      {/* 3B: Effort Headline Callout */}
      <div className="effort-headline-callout">
        <div className="main">A simple face verification issue takes 5 channels, 3 re-explanations, and 3 days.<br />It should take 1 channel, 0 re-explanations, and 5 minutes.</div>
        <div className="score-shift">
          <span className="from">CES 12</span>
          <span className="arrow">\u2192</span>
          <span className="to">CES 1</span>
        </div>
      </div>

      <InsightCallout level="critical">{customerEffort.headline}</InsightCallout>

      {/* ── SECTION 4: Agent Effort Lens ── */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginTop: 12, marginBottom: 4 }}>Agent Effort Lens</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>How much of agent work on email is productive?</div>

      {/* 4A: Ceremony Donut + Breakdown */}
      <div className="ceremony-section">
        <ChartCard title="The Ceremony Problem" subtitle="80.7% of email messages are non-resolution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={ceremonyData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" startAngle={90} endAngle={-270}>
                {ceremonyData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <text x="50%" y="46%" textAnchor="middle" fill="var(--text)" fontSize={28} fontWeight={800}>80.7%</text>
              <text x="50%" y="58%" textAnchor="middle" fill="var(--text-muted)" fontSize={12}>ceremony</text>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="What Fills the 80.7%" subtitle="Breakdown of non-resolution email activity">
          <div className="ceremony-breakdown">
            {agentEffort.ceremonyBreakdown.map((item, i) => (
              <div key={i} className="ceremony-item">
                <span className="type">{item.type}</span>
                <span className="pct">{item.pct}%</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, fontStyle: 'italic' }}>{agentEffort.headline}</div>
        </ChartCard>
      </div>

      {/* 4B: Agent Action Distribution */}
      <ChartCard title="Agent Action Distribution" subtitle="What agents actually DO per email \u2014 87% is automatable">
        <div style={{ padding: '8px 0' }}>
          {agentEffort.actionBreakdown.map((act, i) => (
            <div key={i} className="action-bar-row">
              <div className="action-bar-label">
                {act.action}
                {act.automatable && <span className="automatable-badge" title="Automatable">\u2705</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div className={`action-bar ${act.effort.toLowerCase()}`} style={{ width: `${act.pct * 2.5}%` }}>
                  {act.pct}%
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 180, paddingLeft: 8 }}>{act.desc}</div>
            </div>
          ))}
        </div>
      </ChartCard>

      <InsightCallout level="good">
        87% of agent actions (Template + Info + Lookup + Change + Redirect + Close) are automatable. Only 13% (Manual Process + Approval) genuinely needs a human.
      </InsightCallout>

      {/* 4C: Effort Reframe */}
      <div className="effort-reframe">
        <div className="effort-reframe-card current">
          <div className="card-title" style={{ color: '#FF4757' }}>{agentEffort.effortReframe.current.label}</div>
          <div className="effort-reframe-bar">
            <div className="ceremony" style={{ width: '80.7%' }}>80.7% ceremony</div>
            <div className="productive" style={{ width: '19.3%' }}>19.3%</div>
          </div>
          <div className="effort-reframe-stats">
            <span style={{ color: '#FF4757' }}>{agentEffort.effortReframe.current.totalTouches - agentEffort.effortReframe.current.productiveTouches} ceremony touches</span>
            <span style={{ color: '#00D09C' }}>{agentEffort.effortReframe.current.productiveTouches} productive</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{agentEffort.effortReframe.current.insight}</div>
        </div>
        <div className="effort-reframe-card target">
          <div className="card-title" style={{ color: '#00D09C' }}>{agentEffort.effortReframe.target.label}</div>
          <div className="effort-reframe-bar">
            <div className="ceremony" style={{ width: '30%' }}>30%</div>
            <div className="productive" style={{ width: '70%' }}>70% productive</div>
          </div>
          <div className="effort-reframe-stats">
            <span style={{ color: '#FF4757' }}>0.45 ceremony</span>
            <span style={{ color: '#00D09C' }}>{agentEffort.effortReframe.target.productiveTouches} productive</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{agentEffort.effortReframe.target.insight}</div>
        </div>
      </div>

      {/* SECTION 5: Cascade Effort Patterns */}
      <ChartCard title="Cross-Channel Cascade Effort" subtitle="Users who touched multiple channels before resolution">
        <div style={{ overflowX: 'auto' }}>
          <table className="cascade-table">
            <thead>
              <tr>
                <th>Cascade Pattern</th>
                <th style={{ textAlign: 'right' }}>Users</th>
                <th style={{ textAlign: 'center' }}>Channels</th>
                <th style={{ textAlign: 'center' }}>Re-explains</th>
                <th style={{ textAlign: 'center' }}>Avg Days</th>
                <th style={{ textAlign: 'center' }}>Effort Level</th>
              </tr>
            </thead>
            <tbody>
              {customerEffort.cascadeEffort.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{p.pattern}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{p.users.toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>{p.channelsTouched}</td>
                  <td style={{ textAlign: 'center' }}>{p.reExplanations}</td>
                  <td style={{ textAlign: 'center' }}>{p.avgDays}</td>
                  <td style={{ textAlign: 'center' }}><EffortBadge level={p.effort} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

// ════════════════════════════════════════════════════
// TAB 3: Issue Categories
// ════════════════════════════════════════════════════
function IssueCategoriesTab() {
  const { categories, automationScoring } = emailData;
  const chartCategories = categories.slice(0, 15);
  const catSort = useSortable(categories, 'volume', 'desc');
  const scoreSort = useSortable(automationScoring, 'weighted', 'desc');

  return (
    <div className="section-gap">
      {/* Section 6A: Category Bar Chart */}
      <ChartCard title="Email Categories by Volume" subtitle="Top 15 \u2014 colored by automation verdict">
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={chartCategories} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis type="number" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" width={200} tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }}
              formatter={(val, name, props) => [`${val.toLocaleString()} (${props.payload.pctOfEmail}%)`, 'Volume']} />
            <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
              {chartCategories.map((cat, i) => {
                const vDef = emailData.verdictDefs[cat.verdict];
                return <Cell key={i} fill={vDef ? vDef.color : '#9690B0'} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightCallout level="good">
        Top 3 categories (Spam + Others + Account) = 35.7% of email volume. All are P0/P1 automatable with zero engineering effort.
      </InsightCallout>
      <InsightCallout level="critical">
        Categories with L2 {'\u2265'} 25% (User Name 52.2%, Device 27%, Activation 25.9%, Suspicious 25.9%) are the highest agent-effort categories. These need approval workflow automation.
      </InsightCallout>

      {/* Section 6B: Sortable Category Table */}
      <ChartCard title="Full Category Breakdown" subtitle="21 categories with effort profiles \u2014 click headers to sort">
        <div style={{ overflowX: 'auto', maxHeight: 600, overflowY: 'auto' }}>
          <table className="category-matrix">
            <thead>
              <tr>
                <SortHeader col="name" label="Category" sortable={catSort} />
                <SortHeader col="volume" label="Volume" sortable={catSort} align="right" />
                <SortHeader col="pctOfEmail" label="%" sortable={catSort} align="right" />
                <SortHeader col="l2Rate" label="L2 Rate" sortable={catSort} align="right" />
                <SortHeader col="customerEffort" label="Cust. Effort" sortable={catSort} align="center" />
                <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 1 }}>Agent Effort</th>
                <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 1 }}>Verdict</th>
                <SortHeader col="priority" label="Priority" sortable={catSort} align="center" />
                <SortHeader col="reduction" label="Reduction" sortable={catSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {catSort.sorted.map((cat, i) => (
                <tr key={i} className={cat.l2Rate >= 25 ? 'high-cascade' : ''}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 500, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{cat.volume.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>{cat.pctOfEmail}%</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right', color: cat.l2Rate >= 25 ? 'var(--accent-red)' : cat.l2Rate >= 10 ? 'var(--accent-amber)' : 'var(--text)', fontWeight: cat.l2Rate >= 25 ? 700 : 400 }}>{cat.l2Rate}%</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center', color: cat.customerEffort >= 7 ? 'var(--accent-red)' : cat.customerEffort >= 5 ? 'var(--accent-amber)' : 'var(--text)', fontWeight: cat.customerEffort >= 7 ? 700 : 400 }}>{cat.customerEffort}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}><EffortBadge level={cat.agentEffort} /></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}><VerdictPill verdict={cat.verdict} /></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 600, color: cat.priority === 'P0' ? 'var(--accent-red)' : cat.priority === 'P1' ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{cat.priority}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{cat.reduction > 0 ? `-${cat.reduction.toLocaleString()}` : '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Verdict Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0' }}>
        {Object.entries(emailData.verdictDefs).map(([key, def]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <VerdictPill verdict={key} />
            <span style={{ color: 'var(--text-muted)' }}>{def.desc}</span>
          </div>
        ))}
      </div>

      {/* Section 7: Automation Scoring Heatmap */}
      <ChartCard title="Automation Scoring Matrix" subtitle="Volume(30%) + Simplicity(25%) + Data(15%) + Impact(15%) + CostSave(15%)">
        <div style={{ overflowX: 'auto' }}>
          <table className="category-matrix">
            <thead>
              <tr>
                <SortHeader col="category" label="Category" sortable={scoreSort} />
                <SortHeader col="vol" label="Vol (30%)" sortable={scoreSort} align="center" />
                <SortHeader col="simp" label="Simp (25%)" sortable={scoreSort} align="center" />
                <SortHeader col="data" label="Data (15%)" sortable={scoreSort} align="center" />
                <SortHeader col="impact" label="Impact (15%)" sortable={scoreSort} align="center" />
                <SortHeader col="cost" label="Cost (15%)" sortable={scoreSort} align="center" />
                <SortHeader col="weighted" label="Weighted" sortable={scoreSort} align="right" />
                <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 1 }}>Priority</th>
                <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 1 }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {scoreSort.sorted.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{row.category}</td>
                  {['vol', 'simp', 'data', 'impact', 'cost'].map(dim => (
                    <td key={dim} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}><ScoreCell score={row[dim]} /></td>
                  ))}
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: row.weighted >= 4 ? 'var(--accent-green)' : row.weighted >= 3 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{row.weighted}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 700, color: row.priority === 'P0' ? 'var(--accent-red)' : row.priority === 'P1' ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{row.priority}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <InsightCallout level="info">
        Weighted {'\u2265'}4.0 = P0 (automate now) | 3.0\u20133.9 = P1/P2 (phased) | {'<'}3.0 = P3 (human-assisted).
      </InsightCallout>
    </div>
  );
}

// ════════════════════════════════════════════════════
// TAB 4: Automation Playbook
// ════════════════════════════════════════════════════
function AutomationPlaybookTab() {
  const { caseStudies, automationRoadmap, metrics, source, reportedVsReality } = emailData;
  const [expandedPhase, setExpandedPhase] = useState(null);
  const reductionBarRef = useRef(null);
  const [animateBar, setAnimateBar] = useState(false);

  useEffect(() => {
    const el = reductionBarRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setAnimateBar(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const resultClass = (r) => r === 'FAIL' ? 'fail' : r === 'PARTIAL' ? 'partial' : 'resolved';

  return (
    <div className="section-gap">
      {/* Section 8: Case Studies */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Cascading Failure Case Studies</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Real user journeys showing how channel failures compound effort</div>

      {caseStudies.map((cs, idx) => (
        <div key={idx} className="case-study-card">
          <div className="case-study-header">
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{cs.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>{cs.subtitle}</div>
            </div>
            <div className="case-study-stats">
              <div className="case-study-stat"><div className="stat-value">{cs.channelsTouched}</div><div className="stat-label">Channels</div></div>
              <div className="case-study-stat"><div className="stat-value">{cs.timesExplained}</div><div className="stat-label">Re-explains</div></div>
              <div className="case-study-stat"><div className="stat-value">{cs.daysToResolve}</div><div className="stat-label">Days</div></div>
            </div>
          </div>

          <div className="journey-pipeline">
            {cs.journey.map((step, si) => (
              <React.Fragment key={si}>
                {si > 0 && <span className="journey-arrow"><ArrowRight size={20} /></span>}
                <div className={`journey-step ${resultClass(step.result)}`}>
                  <div className="step-channel">{step.channel}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{step.result}</div>
                  <div style={{ fontSize: 10, marginTop: 4, opacity: 0.8, maxWidth: 140 }}>{step.detail}</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Effort Saved Box */}
          <div className="effort-saved-box">
            <div className="customer-effort">
              <div><div className="label">Customer Effort Score</div><div><span className="from">{cs.customerEffortScore}</span><span className="arrow"> \u2192 </span><span className="to">{cs.targetEffortScore}</span></div></div>
            </div>
            <div className="agent-effort">
              <div style={{ textAlign: 'right' }}><div className="label">Effort Saved</div><div style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 600 }}>{cs.effortSaved}</div></div>
            </div>
          </div>

          <div className="case-study-fix"><strong>FIX:</strong> {cs.fix}</div>
          {cs.scale && (
            <div style={{ marginTop: 8, padding: '8px 16px', background: 'rgba(123,97,255,0.1)', borderRadius: 8, fontSize: 12, color: 'var(--accent-blue)', fontWeight: 600 }}>
              Scale: {cs.scale}
            </div>
          )}
        </div>
      ))}

      {/* Section 9: Automation Roadmap */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginTop: 8, marginBottom: 4 }}>Automation Roadmap</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Progressive email reduction from {automationRoadmap.currentMonthly.toLocaleString()}/mo to {automationRoadmap.phases[automationRoadmap.phases.length - 1].remainingEmail}/mo</div>

      {/* 9A: Phase Timeline */}
      <div className="automation-timeline">
        {automationRoadmap.phases.map((phase, i) => (
          <div key={i} className="timeline-phase" style={{ background: `${phase.color}18`, color: phase.color, cursor: 'pointer', border: expandedPhase === i ? `2px solid ${phase.color}` : '2px solid transparent' }}
            onClick={() => setExpandedPhase(expandedPhase === i ? null : i)}>
            <div className="phase-label">{phase.phase}: {phase.label}</div>
            <div className="phase-timeline">{phase.timeline}</div>
            <div className="phase-reduction">-{phase.totalReduction.toLocaleString()}/mo</div>
            <div className="phase-savings" style={{ fontSize: 11, marginTop: 8, opacity: 0.9 }}>{phase.effortImpact}</div>
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>{phase.remainingEmail.toLocaleString()} remaining</div>
          </div>
        ))}
      </div>

      {/* 9B: Reduction Bar */}
      <div ref={reductionBarRef} style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          <span>Current: {automationRoadmap.currentMonthly.toLocaleString()}/mo</span>
          <span>Target: {automationRoadmap.phases[automationRoadmap.phases.length - 1].remainingEmail}/mo</span>
        </div>
        <div className="reduction-bar" style={{ height: 32 }}>
          {automationRoadmap.phases.map((phase, i) => {
            const pct = ((phase.totalReduction - (i > 0 ? automationRoadmap.phases[i - 1].totalReduction : 0)) / automationRoadmap.currentMonthly) * 100;
            return (
              <div key={i} className="fill" style={{ width: animateBar ? `${pct}%` : '0%', background: phase.color, transitionDelay: `${i * 0.3}s` }}>
                {pct >= 8 && <span>{phase.phase}</span>}
              </div>
            );
          })}
          <div className="fill" style={{
            width: animateBar ? `${(automationRoadmap.phases[automationRoadmap.phases.length - 1].remainingEmail / automationRoadmap.currentMonthly) * 100}%` : '0%',
            background: 'var(--border)', transitionDelay: `${automationRoadmap.phases.length * 0.3}s`,
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Remaining</span>
          </div>
        </div>
      </div>

      {/* 9C: Initiative Detail */}
      {expandedPhase !== null && (
        <ChartCard title={`${automationRoadmap.phases[expandedPhase].phase}: ${automationRoadmap.phases[expandedPhase].label} \u2014 Initiatives`} subtitle={automationRoadmap.phases[expandedPhase].timeline}>
          <table className="initiative-table">
            <thead>
              <tr><th>Story ID</th><th>Initiative</th><th style={{ textAlign: 'right' }}>Reduction</th><th>Effort</th><th>Owner</th><th>Dependencies</th></tr>
            </thead>
            <tbody>
              {automationRoadmap.phases[expandedPhase].initiatives.map((init, i) => (
                <tr key={i}>
                  <td><span className="initiative-id">{init.id}</span></td>
                  <td style={{ fontWeight: 500 }}>{init.name}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: init.reduction > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>{init.reduction > 0 ? `-${init.reduction.toLocaleString()}` : '\u2014'}</td>
                  <td>{init.effort}</td>
                  <td style={{ fontSize: 12 }}>{init.owner}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{init.deps}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                <td colSpan={2}>Phase Total</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>-{automationRoadmap.phases[expandedPhase].totalReduction.toLocaleString()}/mo</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </ChartCard>
      )}

      {expandedPhase === null && <InsightCallout level="info">Click a phase above to see initiative details, story IDs, owners, and dependencies.</InsightCallout>}

      {/* 9D: Metrics Table */}
      <ChartCard title="Email Optimization KPIs" subtitle="Baseline \u2192 3-month \u2192 6-month targets">
        <div style={{ overflowX: 'auto' }}>
          <table className="metrics-table">
            <thead>
              <tr><th>Metric</th><th>Current Baseline</th><th>3-Month Target</th><th>6-Month Target</th><th>Measurement</th></tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{m.metric}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{m.baseline}</td>
                  <td className="target-cell">{m.target3m}</td>
                  <td className="target-cell">{m.target6m}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Reported vs Reality */}
      <ChartCard title="Reported vs Reality" subtitle="Channel performance claims vs actual resolution">
        <div style={{ overflowX: 'auto' }}>
          <table className="cascade-table">
            <thead><tr><th>Channel</th><th style={{ textAlign: 'center' }}>Reported</th><th style={{ textAlign: 'center' }}>Reality</th><th>Why the Gap</th></tr></thead>
            <tbody>
              {reportedVsReality.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{r.channel}</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.reported}</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-red)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.reality}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* 9E: Data Footer */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Data Sources & Methodology</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}><strong>Primary:</strong> {source.primary}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          <strong>Secondary Sources:</strong>
          <ul style={{ margin: '6px 0 0 16px', lineHeight: 1.8 }}>{source.secondary.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <strong>Methodology:</strong>
          <ul style={{ margin: '6px 0 0 16px', lineHeight: 1.8 }}>{source.methodology.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          Note: L2 escalation rates are actual Salesforce data per subcategory \u2014 not estimates. Customer Effort Score uses the formula: Channels\u00d72 + Re-explanations\u00d72 + Days\u00d71.
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════
export default function EmailDeepDive() {
  const [tab, setTab] = useState('trend');
  const tabs = [
    { key: 'trend', label: 'Trend & Workload' },
    { key: 'effort', label: 'The Effort Problem' },
    { key: 'categories', label: 'Issue Categories' },
    { key: 'playbook', label: 'Automation Playbook' },
  ];

  return (
    <div className="page">
      <HeroBanner />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'trend' && <TrendWorkloadTab />}
      {tab === 'effort' && <EffortProblemTab />}
      {tab === 'categories' && <IssueCategoriesTab />}
      {tab === 'playbook' && <AutomationPlaybookTab />}
    </div>
  );
}
