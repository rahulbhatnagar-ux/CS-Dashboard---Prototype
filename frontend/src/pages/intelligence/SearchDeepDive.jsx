import React, { useState, useMemo } from 'react';
import ChartCard from '../../components/ChartCard';
import TabBar from '../../components/TabBar';
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, PieChart, Pie,
  Treemap,
} from 'recharts';
import {
  Search, BookOpen, ArrowUpRight, BarChart3, AlertTriangle,
  CheckCircle, Info, ChevronDown, ChevronUp, Shield,
} from 'lucide-react';
import { searchData } from '../../data/searchData';

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

// ── Resolution Pill ──
function ResolvePill({ resolve }) {
  const map = {
    KB_RESOLVABLE:  { cls: 'kb',   label: 'KB' },
    NEEDS_FLOW:     { cls: 'flow', label: 'Flow' },
    NEEDS_API:      { cls: 'api',  label: 'API' },
    NEEDS_AGENT:    { cls: 'agent', label: 'Agent' },
    NEEDS_AUTH:     { cls: 'auth', label: 'Auth' },
    NEEDS_AUTH_OR_UNRESOLVABLE: { cls: 'auth', label: 'Auth' },
    NEEDS_FLOW_OR_AGENT: { cls: 'flow', label: 'Flow/Agent' },
    UX_FIX:         { cls: 'ux',   label: 'UX Fix' },
    UNKNOWN:        { cls: 'unknown', label: 'Unknown' },
    UNRESOLVABLE:   { cls: 'agent', label: 'Unresolvable' },
  };
  const m = map[resolve] || { cls: 'unknown', label: resolve };
  return <span className={`resolve-pill ${m.cls}`}>{m.label}</span>;
}

// ── Priority Pill ──
function PriorityPill({ priority }) {
  const colors = { P0: '#00D09C', P1: '#7B61FF', P2: '#FFB020', P3: '#9690B0' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${colors[priority] || '#9690B0'}20`, color: colors[priority] || '#9690B0' }}>
      {priority}
    </span>
  );
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
    <th style={{ padding: '10px 12px', textAlign: align || 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 1 }}
      onClick={() => sortable.toggleSort(col)}>
      {label}<sortable.SortIcon col={col} />
    </th>
  );
}

// ── Resolution color helper ──
function resolveColor(res) {
  const map = { KB_RESOLVABLE: '#00D09C', NEEDS_FLOW: '#7B61FF', NEEDS_API: '#FFB020', NEEDS_AGENT: '#FF4757', NEEDS_AUTH: '#FF4757', NEEDS_AUTH_OR_UNRESOLVABLE: '#FF4757', NEEDS_FLOW_OR_AGENT: '#7B61FF', UX_FIX: '#9690B0', UNKNOWN: '#B8B0C8', UNRESOLVABLE: '#7A7490' };
  return map[res] || '#9690B0';
}

// ════════════════════════════════════════════════════
// HERO BANNER
// ════════════════════════════════════════════════════
function HeroBanner() {
  const { hero } = searchData;
  const iconMap = { search: Search, book: BookOpen, 'arrow-up-right': ArrowUpRight, 'bar-chart': BarChart3 };
  return (
    <div className="email-hero">
      <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'rgba(248,250,252,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Intelligence</div>
      <h1>{hero.title}</h1>
      <div className="tagline">{hero.subtitle}</div>
      <div className="hero-metrics">
        {hero.metrics.map((m, i) => {
          const Icon = iconMap[m.icon] || Search;
          const isCriticalKB = m.label === 'KB-Resolvable';
          return (
            <div key={i} className={`metric-card ${m.status || ''}`} style={isCriticalKB ? { border: '2px solid #FF4757', boxShadow: '0 0 20px rgba(255,71,87,0.3)' } : {}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon size={16} style={{ color: m.status === 'critical' ? '#FF4757' : '#9690B0' }} />
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
// TAB 1: Search Landscape
// ════════════════════════════════════════════════════
function SearchLandscapeTab() {
  const { weeklyTrend, intentGroups, topQueries } = searchData;
  const querySort = useSortable(topQueries, 'volume', 'desc');

  // Build treemap data
  const treemapData = intentGroups.map(g => ({
    name: g.name, size: g.volume, color: resolveColor(g.resolution),
    pct: g.pct, deflect: g.deflectRate,
  }));

  // Sort groups by volume for horizontal bar
  const sortedGroups = [...intentGroups].sort((a, b) => b.volume - a.volume);

  return (
    <div className="section-gap">
      {/* Section 2: Weekly Trend */}
      <ChartCard title="Weekly Search Volume" subtitle="Oct 2025 \u2013 Feb 2026 \u2014 885/wk \u2192 4,641/wk (+425%)">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="week" tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
            <YAxis yAxisId="left" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }} />
            <ReferenceLine x="Nov 17" yAxisId="left" stroke="#9690B0" strokeDasharray="6 4" label={{ value: 'HC Launch', position: 'top', fill: '#9690B0', fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="volume" fill="#3D3568" radius={[4, 4, 0, 0]} name="Total Queries" />
            <Line yAxisId="left" type="monotone" dataKey="unique" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 3, fill: '#2dd4bf' }} name="Unique Sessions" />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightCallout level="critical">
        Search volume grew +425% since HC launch. But volume {'\u2260'} resolution. With zero feedback captured, we're flying blind on whether any of these searches actually helped.
      </InsightCallout>

      {/* Section 3A: Treemap */}
      <ChartCard title="Search Intent Taxonomy" subtitle="13 groups sized by volume, colored by resolution type">
        <ResponsiveContainer width="100%" height={380}>
          <Treemap data={treemapData} dataKey="size" nameKey="name" stroke="var(--bg-primary)" strokeWidth={2}>
            {treemapData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <Tooltip content={({ payload }) => {
              if (!payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                  <div>Volume: {d.size?.toLocaleString()} ({d.pct}%)</div>
                  <div>Deflection: {d.deflect}%</div>
                </div>
              );
            }} />
          </Treemap>
        </ResponsiveContainer>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, fontSize: 11 }}>
          {[
            { label: 'KB Resolvable', color: '#00D09C' },
            { label: 'Needs Flow', color: '#7B61FF' },
            { label: 'Needs API', color: '#FFB020' },
            { label: 'Needs Agent', color: '#FF4757' },
            { label: 'UX Fix / Unknown', color: '#9690B0' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Section 3B: Horizontal Bar */}
      <ChartCard title="Intent Groups by Volume" subtitle="13 groups sorted by volume \u2014 deflection rate shown on right">
        <ResponsiveContainer width="100%" height={440}>
          <BarChart data={sortedGroups} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis type="number" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" width={160} tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }}
              formatter={(val, name, props) => {
                if (name === 'Volume') return [`${val.toLocaleString()} (${props.payload.pct}%)`, 'Volume'];
                return [val, name];
              }} />
            <Bar dataKey="volume" name="Volume" radius={[0, 4, 4, 0]}>
              {sortedGroups.map((g, i) => (
                <Cell key={i} fill={resolveColor(g.resolution)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Deflection annotations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0' }}>
          {sortedGroups.slice(0, 6).map((g, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{g.name}</span>
              <span style={{ fontWeight: 700, color: g.deflectRate > 60 ? 'var(--accent-red)' : g.deflectRate > 40 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                {g.deflectRate}% deflect
              </span>
            </div>
          ))}
        </div>
      </ChartCard>

      <InsightCallout level="warning">
        Users search by ACTION (withdraw, delete, reset PIN). The KB is organized by PRODUCT (gold, stocks, crypto). Only 27.9% of searches match what a KB can answer. 72.1% need flows, APIs, or agent routing.
      </InsightCallout>

      {/* Section 3C: Top Queries Table */}
      <ChartCard title="Top Search Queries" subtitle="15 most frequent queries with resolution type">
        <div style={{ overflowX: 'auto' }}>
          <table className="top-queries-table">
            <thead>
              <tr>
                <SortHeader col="query" label="Query" sortable={querySort} />
                <SortHeader col="volume" label="Volume" sortable={querySort} align="right" />
                <SortHeader col="group" label="Group" sortable={querySort} />
                <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', background: 'var(--bg-card)' }}>Resolution</th>
              </tr>
            </thead>
            <tbody>
              {querySort.sorted.map((q, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{q.query}</td>
                  <td className="volume-cell" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{q.volume}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>{q.group}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}><ResolvePill resolve={q.resolve} /></td>
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
// TAB 2: The Personal Query Problem (CENTERPIECE)
// ════════════════════════════════════════════════════
function PersonalQueryTab() {
  const { piiTiers, selfReferential } = searchData;
  const totalSelfRef = selfReferential.total;
  const maxDistVol = Math.max(...selfReferential.distributionAcrossGroups.map(d => d.volume));
  const distColors = ['#FF4757', '#FFB020', '#7B61FF', '#00D09C', '#00D09C', '#7B61FF', '#8B6914', '#9690B0'];

  return (
    <div className="section-gap">
      {/* Section 4A: PII Tier Pyramid */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>The Three Layers of Personal Queries</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Users type personal data into search expecting personalized answers. The system has no idea who they are.</div>

      <div className="pii-pyramid">
        {piiTiers.map((tier, i) => (
          <div key={i} className={`pii-tier-card t${i + 1}`}>
            <div className="pii-tier-header">
              <div>
                <div className="pii-tier-title" style={{ color: tier.color }}>{tier.tier}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tier.desc}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="pii-tier-volume" style={{ color: tier.color }}>{tier.volume.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tier.pct}% of queries</div>
              </div>
            </div>
            <div className="pii-tier-examples">
              {tier.examples.map((ex, j) => (
                <span key={j} className="pii-tier-example">{ex}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <span className={`resolve-pill ${tier.risk === 'CRITICAL' ? 'agent' : 'auth'}`}>{tier.risk}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tier.riskDesc}</span>
            </div>
            <div className="pii-tier-fix"><strong>Fix:</strong> {tier.fix}</div>
          </div>
        ))}
      </div>

      {/* Section 4B: Self-Referential Intent Stacked Bar */}
      <ChartCard title="What 'Saya'/'My' Users Actually Want" subtitle={`4,130 self-referential queries \u2014 what are they trying to do?`}>
        <div className="self-ref-bar-container">
          <div className="self-ref-bar">
            {selfReferential.intents.map((intent, i) => (
              <div key={i} className="self-ref-segment" style={{ width: `${intent.pct}%`, background: intent.color }}
                title={`${intent.intent}: ${intent.pct}% (${intent.volume})`}>
                {intent.pct >= 10 && <span style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{intent.pct}%</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Intent Cards */}
        <div className="self-ref-intents">
          {selfReferential.intents.map((intent, i) => (
            <div key={i} className="self-ref-intent-card" style={{ borderLeftColor: intent.color, borderLeftWidth: 4, borderLeftStyle: 'solid' }}>
              <div className="intent-header">
                <div className="intent-name">{intent.intent}</div>
                <div className="intent-pct" style={{ color: intent.color }}>{intent.pct}%</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{intent.volume.toLocaleString()} queries</div>
              <div className="examples">
                {intent.examples.slice(0, 2).map((ex, j) => (
                  <div key={j} className="example">"{ex}"</div>
                ))}
              </div>
              <div className="fix">{intent.fix}</div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Section 4C: Headline Callout */}
      <div className="personal-headline-callout">
        <div className="line1">12.5% of searches say "saya" or "my"</div>
        <div className="line2">The system has no idea who they are.</div>
        <div className="line3">77.1% of answers: "hubungi Pluang Care"</div>
        <div className="subtext">The search box is a dead end for anyone with a personal issue.</div>
      </div>

      <InsightCallout level="critical">{selfReferential.insight}</InsightCallout>

      {/* Section 4D: Where Self-Ref Queries Land */}
      <ChartCard title="Where Self-Referential Queries Actually Land" subtitle="4,130 queries spread across ALL groups \u2014 this is a cross-cutting problem">
        <div style={{ padding: '8px 0' }}>
          {selfReferential.distributionAcrossGroups.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ minWidth: 180, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{d.group}</div>
              <div style={{ flex: 1, height: 20, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(d.volume / maxDistVol) * 100}%`, background: distColors[i % distColors.length], borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', minWidth: 32 }}>
                  {d.volume}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Section 5: PII Privacy Risk */}
      <ChartCard title="Privacy Risk: Hard PII in Search Logs" subtitle="28 queries contain actual email addresses, phone numbers, or NIK">
        <InsightCallout level="critical">
          Users are typing real email addresses and phone numbers into the search box. These get logged in the RAG system. PII detection should intercept BEFORE the search fires and redirect to an authenticated flow.
        </InsightCallout>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
          {piiTiers[0].examples.map((ex, i) => (
            <span key={i} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(204,56,68,0.1)', border: '1px solid rgba(204,56,68,0.3)', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#CC3844' }}>
              {ex}
            </span>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

// ════════════════════════════════════════════════════
// TAB 3: Answer Quality
// ════════════════════════════════════════════════════
function AnswerQualityTab() {
  const { answerQuality, language } = searchData;

  const verdictColor = (v) => v === 'GOOD' ? '#00D09C' : v === 'MIXED' ? '#FFB020' : '#FF4757';
  const verdictCls = (v) => v === 'GOOD' ? 'good' : v === 'MIXED' ? 'mixed' : 'poor';

  return (
    <div className="section-gap">
      {/* Section 6A: Reported vs Reality */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>The "Always Answers" Illusion</div>

      <div className="reported-vs-reality">
        <div className="rvr-card reported">
          <div className="card-title" style={{ color: '#00D09C' }}>What the System Reports</div>
          {answerQuality.reportedVsReality.map((r, i) => (
            <div key={i} className="metric-row">
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{r.metric}</span>
              <span style={{ fontWeight: 700, color: '#00D09C', fontFamily: 'var(--font-mono)' }}>{r.reported}</span>
            </div>
          ))}
        </div>
        <div className="rvr-card reality">
          <div className="card-title" style={{ color: '#FF4757' }}>What Actually Happens</div>
          {answerQuality.reportedVsReality.map((r, i) => (
            <div key={i} className="metric-row">
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{r.metric}</span>
              <span style={{ fontWeight: 700, color: '#FF4757', fontFamily: 'var(--font-mono)' }}>{r.reality}</span>
            </div>
          ))}
        </div>
      </div>

      <InsightCallout level="critical">
        {answerQuality.reportedVsReality[0].problem}
      </InsightCallout>

      {/* Section 6B: Answer Length Distribution */}
      <ChartCard title="Answer Length Distribution" subtitle="Avg 758 chars \u2014 most answers are full-length but may not be helpful">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={answerQuality.lengthDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="bucket" tick={{ fill: 'var(--chart-tick)', fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }}
              formatter={(val) => [val.toLocaleString(), 'Count']} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {answerQuality.lengthDistribution.map((entry, i) => (
                <Cell key={i} fill={i < 2 ? '#FF4757' : '#7B61FF'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>652 queries</span> ({(0.1 + 1.9).toFixed(1)}%) got answers under 100 characters \u2014 essentially empty responses.
        </div>
      </ChartCard>

      {/* Section 6C: Deflection Rate by Group */}
      <ChartCard title="Deflection Rate by Intent Group" subtitle="% of answers that say 'contact support' \u2014 colored by quality verdict">
        <div style={{ padding: '8px 0' }}>
          {answerQuality.qualityByGroup.map((g, i) => (
            <div key={i} className="quality-bar-row">
              <div className="quality-bar-label">{g.group}</div>
              <div className="quality-bar-container">
                <div className={`quality-bar-fill ${verdictCls(g.verdict)}`} style={{ width: `${g.deflect}%` }}>
                  {g.deflect}%
                </div>
              </div>
              <div style={{ minWidth: 60, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                {g.apology}% apology
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11 }}>
          {[
            { label: 'GOOD (<30%)', color: '#00D09C' },
            { label: 'MIXED (30\u201360%)', color: '#FFB020' },
            { label: 'POOR (>60%)', color: '#FF4757' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              <span style={{ color: 'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <InsightCallout level="critical">
        Auth & Access has a 78.6% deflection rate \u2014 the system gives a generic article about PINs then says "contact Pluang Care". For PIN queries (the #1 search term), this is the experience 78.6% of the time.
      </InsightCallout>

      {/* Section 7: Language Split */}
      <ChartCard title="Language Distribution" subtitle="Search query language split">
        <div className="language-section">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Indonesian', value: searchData.language.indonesian.pct, fill: '#7B61FF' },
                  { name: 'English', value: searchData.language.english.pct, fill: '#FFB020' },
                ]}
                cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
              </Pie>
              <text x="50%" y="46%" textAnchor="middle" fill="var(--text)" fontSize={20} fontWeight={800}>79.2%</text>
              <text x="50%" y="58%" textAnchor="middle" fill="var(--text-muted)" fontSize={11}>Indonesian</text>
            </PieChart>
          </ResponsiveContainer>
          <div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{searchData.language.indonesian.pct}%</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Indonesian ({searchData.language.indonesian.volume.toLocaleString()})</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{searchData.language.english.pct}%</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>English ({searchData.language.english.volume.toLocaleString()})</div>
              </div>
            </div>
            <InsightCallout level="info">{searchData.language.insight}</InsightCallout>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

// ════════════════════════════════════════════════════
// TAB 4: Fix Map
// ════════════════════════════════════════════════════
function FixMapTab() {
  const { resolvability, searchToEscalation, source } = searchData;
  const fixSort = useSortable(resolvability.intentToFix, 'priority', 'asc');

  return (
    <div className="section-gap">
      {/* Section 8A: Three-Bucket Donut */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Resolvability Matrix</div>

      <div className="grid-2">
        <ChartCard title="Search Query Resolvability" subtitle="Can a knowledge base actually answer this?">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={resolvability.threeBucket} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="volume" startAngle={90} endAngle={-270}>
                {resolvability.threeBucket.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <text x="50%" y="44%" textAnchor="middle" fill="var(--text)" fontSize={28} fontWeight={800}>27.9%</text>
              <text x="50%" y="56%" textAnchor="middle" fill="var(--text-muted)" fontSize={12}>KB-fit</text>
              <Tooltip formatter={(val) => [val.toLocaleString(), 'Queries']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', fontSize: 11 }}>
            {resolvability.threeBucket.map(b => (
              <div key={b.bucket} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: b.color }} />
                <span style={{ color: 'var(--text-muted)' }}>{b.bucket} ({b.pct}%)</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Section 8B: Detailed Resolution Bar */}
        <ChartCard title="Detailed Resolution Types" subtitle="8 resolution channels needed">
          <div style={{ padding: '8px 0' }}>
            {resolvability.summary.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ minWidth: 190, fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{r.resolution}</div>
                <div style={{ flex: 1, height: 20, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct * 3}%`, background: r.color, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 6, fontSize: 10, fontWeight: 700, color: '#fff', minWidth: 32 }}>
                    {r.pct}%
                  </div>
                </div>
                <div style={{ minWidth: 60, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                  {r.volume.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Section 8C: Intent → Fix Table */}
      <ChartCard title="Intent \u2192 Fix Mapping" subtitle="Engineering takeaway \u2014 10 intents mapped to specific technical fixes">
        <div style={{ overflowX: 'auto' }}>
          <table className="intent-fix-table">
            <thead>
              <tr>
                <SortHeader col="intent" label="Intent (Volume)" sortable={fixSort} />
                <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', background: 'var(--bg-card)' }}>Current</th>
                <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', background: 'var(--bg-card)' }}>Needed</th>
                <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', background: 'var(--bg-card)' }}>Engineering</th>
                <SortHeader col="priority" label="Priority" sortable={fixSort} align="center" />
                <SortHeader col="effort" label="Effort" sortable={fixSort} align="center" />
              </tr>
            </thead>
            <tbody>
              {fixSort.sorted.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{row.intent}</td>
                  <td className="current" style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{row.currentChannel}</td>
                  <td className="needed" style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{row.neededChannel}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>{row.engineering}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}><PriorityPill priority={row.priority} /></td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: 12, fontWeight: 600, color: row.effort === 'Low' || row.effort === 'None' ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{row.effort}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <InsightCallout level="good">
        4 P0 fixes require LOW or no engineering effort: PIN reset deep link, login recovery flow, support button detection, and content quality updates. These alone cover 7,534 queries (22.8%).
      </InsightCallout>

      {/* Section 9: Search → Escalation Bridge */}
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginTop: 8, marginBottom: 4 }}>Search {'\u2192'} Email Escalation Bridge</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{searchToEscalation.headline}</div>

      <ChartCard title="Search Failure Drives Email Volume" subtitle="Top 5 search intents map directly to top email categories">
        <div style={{ padding: '8px 0' }}>
          {searchToEscalation.bridges.map((b, i) => (
            <div key={i} className="bridge-row">
              <div className="bridge-left">
                <div className="bridge-volume" style={{ color: 'var(--accent-amber)' }}>{b.searchVol.toLocaleString()}</div>
                <div className="bridge-label">{b.searchIntent}</div>
              </div>
              <div className="bridge-arrow">{'\u2192'}</div>
              <div className="bridge-right">
                <div className="bridge-volume" style={{ color: 'var(--accent-red)' }}>{b.emailVol.toLocaleString()}</div>
                <div className="bridge-label">{b.emailSubcategory}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          {searchToEscalation.bridges.map((b, i) => (
            <div key={i} className="bridge-signal">{b.cascadeSignal}</div>
          ))}
        </div>
      </ChartCard>

      <InsightCallout level="warning">
        The top 5 search failure categories feed directly into the top 5 email categories. Fix search for these 5 intents and you reduce email volume at the source.
      </InsightCallout>

      <InsightCallout level="info">{searchToEscalation.overlapInsight}</InsightCallout>

      {/* Section 10: Data Footer */}
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
          Note: RAG fires twice per search session (64.5% duplicate rate). Dashboard shows total queries (32,972) as system load. Unique sessions {'\u2248'} 16,486.
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════
export default function SearchDeepDive() {
  const [tab, setTab] = useState('landscape');
  const tabs = [
    { key: 'landscape', label: 'Search Landscape' },
    { key: 'personal', label: 'The Personal Query Problem' },
    { key: 'quality', label: 'Answer Quality' },
    { key: 'fixmap', label: 'Fix Map' },
  ];

  return (
    <div className="page">
      <HeroBanner />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'landscape' && <SearchLandscapeTab />}
      {tab === 'personal' && <PersonalQueryTab />}
      {tab === 'quality' && <AnswerQualityTab />}
      {tab === 'fixmap' && <FixMapTab />}
    </div>
  );
}
