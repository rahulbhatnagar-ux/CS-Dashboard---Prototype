import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import DataSourceLabel from '../../components/DataSourceLabel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundaryCard from '../../components/ErrorBoundaryCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import {
  MessageSquare, AlertTriangle, TrendingUp, Database, Eye,
  ChevronDown, ChevronRight, Smartphone, ShieldAlert, UserCog,
  BookOpen, Star, ArrowUpRight, ArrowDownRight, Minus as MinusIcon,
  Info,
} from 'lucide-react';

/* ── tiny helpers ── */
const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 };
const mono = { fontFamily: 'var(--font-mono)', fontSize: 12 };
const muted = { color: 'var(--text-muted)', fontSize: 12 };
const h3 = { fontSize: 15, fontWeight: 700, marginBottom: 12 };
const chip = (bg, fg) => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 9999,
  fontSize: 11, fontWeight: 600, background: bg, color: fg, lineHeight: '18px',
});

const SignalBadge = ({ type, color }) => {
  const colors = { red: '#FF4757', amber: '#FFB020', blue: '#7B61FF', green: '#14B8A6', gray: '#6B7280' };
  const bg = color ? `${colors[color]}18` : '#6B728018';
  const fg = colors[color] || '#6B7280';
  return <span style={chip(bg, fg)}>{type}</span>;
};

const PriorityBadge = ({ priority }) => {
  const m = { P0: ['#FF4757', '#FEE2E2'], P1: ['#FFB020', '#FEF3C7'], P2: ['#7B61FF', '#DBEAFE'] };
  const [fg, bg] = m[priority] || ['#6B7280', '#F3F4F6'];
  return <span style={chip(bg, fg)}>{priority}</span>;
};

const TrendIcon = ({ trend }) => {
  if (trend?.includes('Rising')) return <ArrowUpRight size={14} style={{ color: '#FF4757' }} />;
  if (trend?.includes('Falling')) return <ArrowDownRight size={14} style={{ color: '#14B8A6' }} />;
  return <MinusIcon size={14} style={{ color: '#6B7280' }} />;
};

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 32 }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(123,97,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={16} style={{ color: 'var(--accent-blue)' }} />
    </div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      {subtitle && <div style={muted}>{subtitle}</div>}
    </div>
  </div>
);

const MiniSparkline = ({ data, color = '#7B61FF', width = 80, height = 28 }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const ttStyle = {
  background: 'var(--chart-tooltip-bg, #1C1835)',
  border: '1px solid var(--chart-tooltip-border, #3D3568)',
  borderRadius: 8, fontSize: 12,
};

export default function ProductFeedback() {
  const { data, loading, error, refetch } = useApi('/api/product-feedback');

  const [showMethodology, setShowMethodology] = useState(false);
  const [showExclusions, setShowExclusions] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [expandedDive, setExpandedDive] = useState('faceVerification');

  if (loading) return <div className="page"><LoadingSpinner message="Loading product feedback…" /></div>;
  if (error) return <div className="page"><ErrorBoundaryCard error={error} onRetry={refetch} /></div>;
  if (!data) return null;

  const { methodology, themes, playStore, deepDives, dataQuality } = data;
  const themeData = themes?.data || [];
  const alerts = themes?.alerts || [];

  return (
    <div className="page">
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div className="page-title">Product Feedback Analysis</div>
        {data && <DataSourceLabel source={data._source} updated={data._updated} />}
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — METHODOLOGY
          ═══════════════════════════════════════════════════════ */}
      <SectionHeader icon={BookOpen} title="Section 1 — Methodology" subtitle="How product feedback was measured from support data" />

      {/* Problem statement */}
      <div style={{ ...card, borderLeft: '3px solid #FFB020' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <AlertTriangle size={14} style={{ color: '#FFB020' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFB020' }}>The Problem</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          {methodology?.problem}
        </div>
      </div>

      {/* Data sources row */}
      <div style={{ ...card }}>
        <div style={h3}><Database size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'var(--accent-blue)' }} />Data Sources ({methodology?.dataSources?.length || 0})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {(methodology?.dataSources || []).map((s, i) => (
            <div key={i} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                {s.count && <span style={{ ...mono, color: 'var(--accent-blue)' }}>{s.count.toLocaleString()}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible: Theme extraction rules */}
      <div style={card}>
        <button onClick={() => setShowRules(!showRules)} style={{
          background: 'none', display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
        }}>
          {showRules ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Theme Extraction Rules ({methodology?.themeRules?.length || 0} themes)
        </button>
        {showRules && (
          <div style={{ marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Theme', 'Rule', 'Example Items__c', 'Signal', 'Confidence'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(methodology?.themeRules || []).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{r.theme}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', maxWidth: 240 }}>{r.rule}</td>
                    <td style={{ padding: '8px 10px', ...mono, color: 'var(--text-muted)', maxWidth: 240 }}>{r.exampleItems}</td>
                    <td style={{ padding: '8px 10px' }}><SignalBadge type={r.signalType} color={r.signalType.includes('Issue') ? 'red' : r.signalType.includes('Gap') ? 'amber' : r.signalType.includes('Voice') ? 'blue' : 'gray'} /></td>
                    <td style={{ padding: '8px 10px', ...mono }}>{r.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collapsible: Exclusions & Limitations */}
      <div style={card}>
        <button onClick={() => setShowExclusions(!showExclusions)} style={{
          background: 'none', display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%',
        }}>
          {showExclusions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Exclusions & Limitations
        </button>
        {showExclusions && (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exclusions</div>
              {(methodology?.exclusions || []).map((e, i) => (
                <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: 6, marginBottom: 6, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{e.label}</span>
                    {e.count && <span style={{ ...mono, color: 'var(--accent-red)' }}>{e.count.toLocaleString()}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.reason}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Limitations</div>
              {(methodology?.limitations || []).map((l, i) => (
                <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-primary)', borderRadius: 6, marginBottom: 6, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <AlertTriangle size={12} style={{ color: '#FFB020', marginRight: 6, verticalAlign: -1 }} />
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — PRODUCT FEEDBACK THEMES
          ═══════════════════════════════════════════════════════ */}
      <SectionHeader icon={MessageSquare} title="Section 2 — Product Feedback Themes" subtitle={`${themes?.totalThemeVolume?.toLocaleString() || '—'} tickets (${themes?.totalThemePct || '—'}%) mapped to ${themeData.length} themes`} />

      {/* Alert strip */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ flex: 1, minWidth: 240, padding: '12px 16px', background: '#FF475712', border: '1px solid #FF475730', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={16} style={{ color: '#FF4757', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FF4757' }}>{a.theme}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FF4757', marginLeft: 8 }}>{a.change}</span>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Theme table with sparklines */}
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Theme', 'Volume', '% All', 'Trend', '4-Mo Sparkline', 'Signal', 'Top Items__c', 'Sources'].map(h => (
                <th key={h} style={{ padding: '10px 10px', textAlign: h === 'Volume' || h === '% All' ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {themeData.map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 10px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{t.theme}</td>
                <td style={{ padding: '10px 10px', textAlign: 'right', ...mono }}>{t.volume.toLocaleString()}</td>
                <td style={{ padding: '10px 10px', textAlign: 'right', ...mono, color: 'var(--text-muted)' }}>{t.pctAll}%</td>
                <td style={{ padding: '10px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendIcon trend={t.trend} />
                  <span style={{ fontSize: 11, color: t.trend?.includes('Rising') ? '#FF4757' : t.trend?.includes('Falling') ? '#14B8A6' : '#6B7280' }}>{t.trend}</span>
                </td>
                <td style={{ padding: '10px 10px' }}>
                  <MiniSparkline data={t.trendData} color={t.trend?.includes('Rising') ? '#FF4757' : t.trend?.includes('Falling') ? '#14B8A6' : '#6B7280'} />
                </td>
                <td style={{ padding: '10px 10px' }}><SignalBadge type={t.signalType} color={t.signalColor} /></td>
                <td style={{ padding: '10px 10px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 220 }}>{t.topItems}</td>
                <td style={{ padding: '10px 10px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 180 }}>{t.sources}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insight */}
      <div style={{ ...card, borderLeft: '3px solid var(--accent-blue)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        <Info size={14} style={{ color: 'var(--accent-blue)', marginRight: 6, verticalAlign: -2 }} />
        <strong>Insight:</strong> {themes?.insight}
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — PLAY STORE REVIEW QUEUE
          ═══════════════════════════════════════════════════════ */}
      <SectionHeader icon={Star} title="Section 3 — Play Store Review Queue" subtitle={`${playStore?.overview?.totalReviews?.toLocaleString() || '—'} reviews ingested as SF tickets`} />

      {/* Overview row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ ...mono, color: 'var(--text-muted)', marginBottom: 4 }}>Total Reviews</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{playStore?.overview?.totalReviews?.toLocaleString()}</div>
        </div>
        <div style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ ...mono, color: 'var(--text-muted)', marginBottom: 4 }}>Features & Suggestions</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FFB020' }}>{playStore?.overview?.featuresSuggestionsPct}%</div>
        </div>
        <div style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ ...mono, color: 'var(--text-muted)', marginBottom: 4 }}>Uncategorized</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FF4757' }}>{playStore?.overview?.uncategorizedPct}%</div>
        </div>
      </div>

      {/* Monthly trend + sub-category side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Monthly trend */}
        <div style={card}>
          <div style={h3}>Monthly Volume Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={playStore?.overview?.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
              <Tooltip contentStyle={ttStyle} />
              <Area type="monotone" dataKey="volume" fill="rgba(123,97,255,0.15)" stroke="#7B61FF" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>{playStore?.overview?.trendNote}</div>
        </div>

        {/* Sub-category breakdown */}
        <div style={card}>
          <div style={h3}>Sub-Category Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={playStore?.subCategory || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
              <XAxis type="number" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 9 }} />
              <Tooltip contentStyle={ttStyle} formatter={(v) => [v.toLocaleString(), 'Tickets']} />
              <Bar dataKey="value" fill="#7B61FF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Items__c breakdown + By Category side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Items__c breakdown */}
        <div style={card}>
          <div style={h3}>Items__c Classification</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Items__c Value', 'Count', '%'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: h !== 'Items__c Value' ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(playStore?.itemsC || []).map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px', color: 'var(--text-primary)', fontWeight: i < 2 ? 600 : 400 }}>{item.name}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', ...mono }}>{item.value.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', ...mono, color: 'var(--text-muted)' }}>{item.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By Category */}
        <div style={card}>
          <div style={h3}>By Ticket Category</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Category', 'Count', '%', 'Note'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Count' || h === '%' ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(playStore?.byCategory || []).map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px', color: 'var(--text-primary)', fontWeight: 600 }}>{c.category}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', ...mono }}>{c.count.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', ...mono, color: 'var(--text-muted)' }}>{c.pct}%</td>
                  <td style={{ padding: '6px 8px', fontSize: 10, color: 'var(--text-muted)' }}>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Play Store insight */}
      <div style={{ ...card, borderLeft: '3px solid #7B61FF', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
        <Info size={14} style={{ color: '#7B61FF', marginRight: 6, verticalAlign: -2 }} />
        <strong>Insight:</strong> {playStore?.insight}
      </div>

      {/* Missing capability card */}
      <div style={{ ...card, borderLeft: '3px solid #FF4757', background: '#FF475706' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#FF4757', marginBottom: 8 }}>{playStore?.gap?.title}</div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {(playStore?.gap?.items || []).map((item, i) => (
            <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>{item}</li>
          ))}
        </ul>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>{playStore?.gap?.note}</div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — RISING THEME DEEP DIVES
          ═══════════════════════════════════════════════════════ */}
      <SectionHeader icon={TrendingUp} title="Section 4 — Rising Theme Deep Dives" subtitle="Three themes requiring product attention" />

      {/* Tab selector for deep dives */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'faceVerification', icon: Eye, label: 'Face Verification / KYC', badge: '+346%', badgeColor: '#FF4757' },
          { key: 'appStability', icon: Smartphone, label: 'App Stability', badge: 'NEW', badgeColor: '#FF4757' },
          { key: 'accountManagement', icon: UserCog, label: 'Account Management', badge: 'Largest', badgeColor: '#FFB020' },
        ].map(t => (
          <button key={t.key} onClick={() => setExpandedDive(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, fontWeight: expandedDive === t.key ? 700 : 400, fontSize: 13,
            background: expandedDive === t.key ? 'rgba(123,97,255,0.10)' : 'var(--bg-primary)',
            color: expandedDive === t.key ? 'var(--accent-blue)' : 'var(--text-muted)',
            border: expandedDive === t.key ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <t.icon size={14} />
            {t.label}
            <span style={chip(t.badgeColor + '18', t.badgeColor)}>{t.badge}</span>
          </button>
        ))}
      </div>

      {/* Face Verification Deep Dive */}
      {expandedDive === 'faceVerification' && deepDives?.faceVerification && (() => {
        const fv = deepDives.faceVerification;
        return (
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{fv.title}</div>
            <div style={{ ...mono, color: 'var(--text-muted)', marginBottom: 16 }}>{fv.total.toLocaleString()} tickets ({fv.pctAll}% of all support volume)</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Monthly growth chart */}
              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Monthly Growth</div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={fv.monthly.map((v, i) => ({ month: ['Oct', 'Nov', 'Dec', 'Jan'][i], value: v }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
                    <Tooltip contentStyle={ttStyle} />
                    <Area type="monotone" dataKey="value" fill="rgba(255,71,87,0.15)" stroke="#FF4757" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Channel breakdown */}
              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Channel Breakdown</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={fv.channelBreakdown || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
                    <XAxis type="number" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
                    <YAxis dataKey="channel" type="category" width={80} tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
                    <Tooltip contentStyle={ttStyle} formatter={(v) => [v.toLocaleString(), 'Tickets']} />
                    <Bar dataKey="count" fill="#FF4757" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Primary item callout */}
            <div style={{ padding: 12, background: '#FF475710', border: '1px solid #FF475725', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#FF4757' }}>
              {fv.primaryItem}
            </div>

            {/* Sub-items table */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Sub-Items</div>
              {(fv.topSubItems || []).map((item, i) => (
                <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...mono, color: 'var(--text-muted)', minWidth: 20 }}>#{i + 1}</span>
                  {item}
                </div>
              ))}
            </div>

            {/* Product implication */}
            <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8, borderLeft: '3px solid #FF4757', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FF4757', marginBottom: 6 }}>Product Implication</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{fv.productImplication}</div>
            </div>

            {/* Cost estimate */}
            <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>Cost Estimate:</strong> {fv.costEstimate}
            </div>
          </div>
        );
      })()}

      {/* App Stability Deep Dive */}
      {expandedDive === 'appStability' && deepDives?.appStability && (() => {
        const as = deepDives.appStability;
        return (
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{as.title}</div>
            <div style={{ ...mono, color: 'var(--text-muted)', marginBottom: 16 }}>{as.total.toLocaleString()} tickets</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Monthly growth chart */}
              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Monthly Emergence</div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={as.monthly.map((v, i) => ({ month: ['Oct', 'Nov', 'Dec', 'Jan'][i], value: v }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
                    <Tooltip contentStyle={ttStyle} />
                    <Area type="monotone" dataKey="value" fill="rgba(255,107,107,0.15)" stroke="#FF6B6B" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Composition */}
              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Composition</div>
                {(as.composition || []).map((c, i) => (
                  <div key={i} style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.item}</span>
                      <span style={{ ...mono, color: '#FF6B6B' }}>{c.count.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight */}
            <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8, borderLeft: '3px solid #FF6B6B', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FF6B6B', marginBottom: 6 }}>Insight</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{as.insight}</div>
            </div>

            {/* Recommendation */}
            <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8, borderLeft: '3px solid var(--accent-blue)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 6 }}>Recommendation</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{as.recommendation}</div>
            </div>
          </div>
        );
      })()}

      {/* Account Management Deep Dive */}
      {expandedDive === 'accountManagement' && deepDives?.accountManagement && (() => {
        const am = deepDives.accountManagement;
        return (
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{am.title}</div>
            <div style={{ ...mono, color: 'var(--text-muted)', marginBottom: 16 }}>{am.total.toLocaleString()} tickets ({am.pctAll}% of all support volume)</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Monthly steady-state chart */}
              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Monthly Trend (Steady Growth)</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={am.monthly.map((v, i) => ({ month: ['Oct', 'Nov', 'Dec', 'Jan'][i], value: v }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #2D2650)" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--chart-tick, #9690B0)', fontSize: 10 }} />
                    <Tooltip contentStyle={ttStyle} />
                    <Bar dataKey="value" fill="#FFB020" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top issues table */}
              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Top 10 Issues</div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {(am.topIssues || []).map((iss, i) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{iss.item}</span>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{iss.note}</div>
                      </div>
                      <span style={{ ...mono, color: '#FFB020', flexShrink: 0 }}>{iss.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product implication */}
            <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8, borderLeft: '3px solid #FFB020', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFB020', marginBottom: 6 }}>Product Implication</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{am.productImplication}</div>
            </div>

            {/* Recommendation */}
            <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8, borderLeft: '3px solid var(--accent-blue)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 6 }}>Recommended Self-Service Features</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{am.recommendation}</div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — DATA QUALITY & NOISE
          ═══════════════════════════════════════════════════════ */}
      <SectionHeader icon={Database} title="Section 5 — Data Quality & Noise" subtitle="Understanding classification quality and instrumentation gaps" />

      {/* Classification donut + noise breakdown side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Classification donut */}
        <div style={card}>
          <div style={h3}>Ticket Classification Distribution</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={dataQuality?.classification || []}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={80}
                  dataKey="value"
                  nameKey="label"
                  paddingAngle={2}
                >
                  {(dataQuality?.classification || []).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={ttStyle} formatter={(v) => [v.toLocaleString(), 'Tickets']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {(dataQuality?.classification || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{c.label}</span>
                  <span style={{ ...mono, color: 'var(--text-muted)' }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Noise breakdown */}
        <div style={card}>
          <div style={h3}>Noise & Data Quality Issues</div>
          {dataQuality?.noise && (
            <div>
              {[
                { key: 'spam', label: 'Spam', color: '#6B7280', icon: '🗑️' },
                { key: 'duplicate', label: 'Duplicate Tickets', color: '#9CA3AF', icon: '📋' },
                { key: 'unclassified', label: 'Unclassified', color: '#FF4757', icon: '⚠️' },
              ].map(n => {
                const d = dataQuality.noise[n.key];
                if (!d) return null;
                return (
                  <div key={n.key} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{n.icon} {n.label}</span>
                      <span style={{ ...mono, color: n.color, fontWeight: 700 }}>{d.total?.toLocaleString()}{d.pct ? ` (${d.pct}%)` : ''}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Sources: {d.sources}</div>
                    {d.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{d.note}</div>}
                    {d.impact && <div style={{ fontSize: 11, color: '#FF4757', fontWeight: 600, marginTop: 4 }}>{d.impact}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Instrumentation recommendations */}
      <div style={card}>
        <div style={h3}>Instrumentation Recommendations</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {(dataQuality?.recommendations || []).map((r, i) => (
            <div key={i} style={{
              padding: 16, background: 'var(--bg-primary)', borderRadius: 8,
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${r.priority === 'P0' ? '#FF4757' : r.priority === 'P1' ? '#FFB020' : '#7B61FF'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <PriorityBadge priority={r.priority} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{r.action}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 6 }}>{r.detail}</div>
              <div style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600 }}>Impact: {r.impact}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
