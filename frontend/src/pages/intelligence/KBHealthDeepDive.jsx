import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, ScatterChart, Scatter, ZAxis,
  Legend, ReferenceLine,
} from 'recharts';
import TabBar from '../../components/TabBar';
import ChartCard from '../../components/ChartCard';
import { kbData } from '../../data/kbData';

/* ── Inline helpers ── */
const InsightCallout = ({ children }) => (
  <div style={{
    background: 'rgba(123,97,255,0.06)', border: '1px solid rgba(123,97,255,0.2)',
    borderLeft: '4px solid var(--accent-blue)', borderRadius: 10,
    padding: '14px 18px', fontSize: 13, lineHeight: 1.7, color: 'var(--text)',
    margin: '12px 0',
  }}>
    <span style={{ fontWeight: 700, marginRight: 6 }}>Insight:</span>{children}
  </div>
);

const FeedbackBadge = ({ status }) => {
  const map = {
    BLIND_SPOT: { cls: 'blind-spot', label: 'Blind Spot' },
    URGENT_FIX: { cls: 'urgent-fix', label: 'Urgent Fix' },
    GOOD: { cls: 'good', label: 'Good' },
  };
  const m = map[status] || { cls: '', label: status };
  return <span className={`feedback-badge ${m.cls}`}>{m.label}</span>;
};

const VerdictPill = ({ verdict }) => {
  const cls = verdict.toLowerCase();
  return <span className={`verdict-pill ${cls}`}>{verdict}</span>;
};

const ImbalancePill = ({ imbalance }) => {
  const map = {
    EXTREME_UNDERSUPPLY: 'extreme-gap',
    EXTREME_OVERSUPPLY: 'over-supplied',
    HIGH_DEMAND_LOW_QUALITY: 'severe-gap',
    HIGH_DEMAND_OK_SUPPLY: 'gap',
    HIGH_DEMAND_NO_SCORE: 'severe-gap',
    MODERATE: 'gap',
    OK: 'balanced',
    OVER_SUPPLIED: 'over-supplied',
  };
  const cls = map[imbalance] || 'balanced';
  const label = imbalance.replace(/_/g, ' ');
  return <span className={`imbalance-pill ${cls}`}>{label}</span>;
};

const EffortBadge = ({ effort }) => {
  const colors = { LOW: '#00D09C', MEDIUM: '#FFB020', HIGH: '#FF4757' };
  return (
    <span style={{
      background: `${colors[effort] || '#9690B0'}20`, color: colors[effort] || '#9690B0',
      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
    }}>
      {effort}
    </span>
  );
};

/* ── Sortable hook ── */
function useSortable(data, defaultKey, defaultDir = 'desc') {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);
  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return copy;
  }, [data, sortKey, sortDir]);
  const toggle = (key) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  return { sorted, sortKey, sortDir, toggle };
}

const SortHeader = ({ label, field, sortKey, sortDir, toggle }) => (
  <th onClick={() => toggle(field)} style={{ cursor: 'pointer' }}>
    {label} {sortKey === field ? (sortDir === 'asc' ? '▲' : '▼') : ''}
  </th>
);

/* ── Custom tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   TAB 1: THE GHOST LIBRARY
   ═══════════════════════════════════════════════════ */
function GhostLibraryTab() {
  const { tiers, concentration, insight } = kbData.viewDistribution;
  const topArts = kbData.topArticles;
  const { sorted, sortKey, sortDir, toggle } = useSortable(topArts, 'views');

  // Pareto data — simulated cumulative
  const paretoData = useMemo(() => {
    // Approximate cumulative view distribution across 1013 articles
    const points = [];
    const total = 12916;
    // top 12 = 44.8%, top 50 = 72.6%, rest linear
    const milestones = [
      { x: 1, cum: 1457/total*100 },
      { x: 4, cum: (1457+840+593+514)/total*100 },
      { x: 12, cum: 44.8 },
      { x: 20, cum: 55 },
      { x: 50, cum: 72.6 },
      { x: 100, cum: 82 },
      { x: 200, cum: 90 },
      { x: 400, cum: 95 },
      { x: 700, cum: 98 },
      { x: 1013, cum: 100 },
    ];
    for (const m of milestones) {
      points.push({ rank: m.x, cumPct: parseFloat(m.cum.toFixed(1)) });
    }
    return points;
  }, []);

  // Score distribution bar data
  const tierBarData = tiers.map(t => ({ name: t.tier.split('(')[0].trim(), count: t.count, pct: t.pct, color: t.color }));

  return (
    <div className="section-gap">
      {/* 2A: View Tier Bar */}
      <ChartCard title="Article View Distribution" subtitle="6 tiers from Ghost to Top — 88.4% of articles are ghosts or dormant">
        <div className="view-tier-bar">
          {tiers.map(t => (
            <div
              key={t.tier}
              className="view-tier-segment"
              style={{ width: `${t.pct}%`, background: t.color, minWidth: t.pct < 2 ? 24 : undefined }}
              title={`${t.tier}: ${t.count} articles (${t.pct}%)`}
            >
              {t.pct > 5 && <span>{t.pct}%</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          {tiers.map(t => (
            <div key={t.tier} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: t.color, display: 'inline-block' }} />
              <span style={{ color: 'var(--text-muted)' }}>{t.tier}: <strong>{t.count}</strong></span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* 2B: Concentration stats */}
      <div className="grid-3">
        {[
          { label: `Top 12 (${concentration.top12.pctArticles}%)`, views: concentration.top12.views, pctViews: concentration.top12.pctViews, color: '#FF4757' },
          { label: `Top 50 (${concentration.top50.pctArticles}%)`, views: concentration.top50.views, pctViews: concentration.top50.pctViews, color: '#FFB020' },
          { label: `Bottom 895 (${concentration.bottom895.pctArticles}%)`, views: concentration.bottom895.views, pctViews: concentration.bottom895.pctViews, color: '#9690B0' },
        ].map(c => (
          <ChartCard key={c.label}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: c.color }}>{c.pctViews}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>of all views ({c.views.toLocaleString()})</div>
            </div>
          </ChartCard>
        ))}
      </div>

      {/* 2B: Pareto curve */}
      <ChartCard title="Cumulative View Concentration" subtitle="Articles ranked by views — Pareto curve">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="rank" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} label={{ value: 'Articles (ranked by views)', position: 'insideBottom', offset: -2, fill: 'var(--chart-tick)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="cumPct" stroke="#7B61FF" strokeWidth={3} dot={{ r: 4 }} name="Cumulative %" />
            <ReferenceLine y={44.8} stroke="#FF4757" strokeDasharray="5 5" label={{ value: '44.8% (Top 12)', position: 'right', fill: '#FF4757', fontSize: 11 }} />
            <ReferenceLine y={72.6} stroke="#FFB020" strokeDasharray="5 5" label={{ value: '72.6% (Top 50)', position: 'right', fill: '#FFB020', fontSize: 11 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Tier bar chart */}
      <ChartCard title="Articles per Tier" subtitle="Article count by view tier">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={tierBarData} layout="vertical" margin={{ left: 100, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis type="number" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Articles">
              {tierBarData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2C: Top Articles Table */}
      <ChartCard title="Top 20 Articles" subtitle="Sorted by views — feedback status shows data availability">
        <div style={{ overflowX: 'auto' }}>
          <table className="intent-fix-table">
            <thead>
              <tr>
                <SortHeader label="Rank" field="rank" sortKey={sortKey} sortDir={sortDir} toggle={toggle} />
                <th>Article</th>
                <SortHeader label="Views" field="views" sortKey={sortKey} sortDir={sortDir} toggle={toggle} />
                <SortHeader label="Votes" field="votes" sortKey={sortKey} sortDir={sortDir} toggle={toggle} />
                <SortHeader label="Upvote %" field="upRate" sortKey={sortKey} sortDir={sortDir} toggle={toggle} />
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(a => (
                <tr key={a.rank}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{a.rank}</td>
                  <td style={{ maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.article}</td>
                  <td style={{ fontWeight: 800, fontSize: 15 }}>{a.views.toLocaleString()}</td>
                  <td>{a.votes}</td>
                  <td>{a.upRate != null ? `${a.upRate}%` : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.category}</td>
                  <td><FeedbackBadge status={a.feedbackStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <InsightCallout>
        Of the top 20 most-viewed articles, 17 have zero or insufficient feedback. We're flying blind on the content that matters most.
      </InsightCallout>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 2: CONTENT QUALITY
   ═══════════════════════════════════════════════════ */
function ContentQualityTab() {
  const q = kbData.qualityScoring;
  const uf = kbData.userFeedback;
  const { sorted: catSorted, sortKey: catSK, sortDir: catSD, toggle: catToggle } = useSortable(q.categoryQuality, 'avgScore', 'asc');
  const { sorted: worstSorted, sortKey: wSK, sortDir: wSD, toggle: wToggle } = useSortable(uf.worstRated, 'upRate', 'asc');

  const feedbackDonut = [
    { name: 'With Feedback', value: uf.articlesWithVotes, color: '#7B61FF' },
    { name: 'No Feedback', value: uf.articlesWithoutVotes, color: '#9690B0' },
  ];

  return (
    <div className="section-gap">
      {/* SECTION 3: Accuracy-Usefulness Gap */}
      <ChartCard title="Sub-Dimension Scores" subtitle="The 4 quality dimensions — the gap between accuracy and usefulness is the story">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={q.subDimensions} layout="vertical" margin={{ left: 110, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis type="number" domain={[0, 10]} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
            <YAxis dataKey="dimension" type="category" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" name="Average Score">
              {q.subDimensions.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3B: The Gap Visual */}
      <div className="gap-visual">
        <div className="gap-score good">
          <div className="value">8.2</div>
          <div className="label">Accuracy</div>
        </div>
        <div className="gap-arrow">
          <div className="gap-label">GAP</div>
          <div className="gap-value">2.6</div>
          <div style={{ fontSize: 28 }}>←→</div>
        </div>
        <div className="gap-score bad">
          <div className="value">5.7</div>
          <div className="label">Usefulness</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', margin: '-12px 0 12px' }}>
        Articles are correct but don't resolve the problem.
      </div>

      {/* 3C: Score Distribution */}
      <ChartCard title="Score Distribution" subtitle="175 scored articles — Note: 0 articles scored 9+ (no 'excellent' content)">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={q.scoreDistribution} margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="range" tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Articles">
              {q.scoreDistribution.map((d, i) => (
                <Cell key={i} fill={d.count === 0 ? '#FF4757' : d.pct > 25 ? '#FFB020' : '#7B61FF'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#FF4757', fontWeight: 700, marginTop: 4 }}>
          Zero articles scored 9+ — there is no &ldquo;excellent&rdquo; content in the KB
        </div>
      </ChartCard>

      {/* 3D: Category Quality Table */}
      <ChartCard title="Quality by Category" subtitle="Category-level quality scores — quality joins at category level, not article level">
        <div style={{ overflowX: 'auto' }}>
          <table className="intent-fix-table">
            <thead>
              <tr>
                <SortHeader label="Category" field="category" sortKey={catSK} sortDir={catSD} toggle={catToggle} />
                <SortHeader label="Articles" field="articles" sortKey={catSK} sortDir={catSD} toggle={catToggle} />
                <SortHeader label="Avg Score" field="avgScore" sortKey={catSK} sortDir={catSD} toggle={catToggle} />
                <SortHeader label="Usefulness" field="usefulness" sortKey={catSK} sortDir={catSD} toggle={catToggle} />
                <SortHeader label="Below 5" field="below5" sortKey={catSK} sortDir={catSD} toggle={catToggle} />
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {catSorted.map(c => (
                <tr key={c.category}>
                  <td style={{ fontWeight: 600 }}>{c.category}</td>
                  <td>{c.articles}</td>
                  <td style={{ fontWeight: 800, color: c.avgScore < 5.5 ? '#FF4757' : c.avgScore < 6.5 ? '#FFB020' : '#00D09C' }}>
                    {c.avgScore}
                  </td>
                  <td style={{ color: c.usefulness != null ? (c.usefulness < 5 ? '#FF4757' : '#FFB020') : 'var(--text-muted)' }}>
                    {c.usefulness != null ? c.usefulness : '—'}
                  </td>
                  <td>{c.below5}</td>
                  <td><VerdictPill verdict={c.verdict} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <InsightCallout>
        {q.acctVsProduct.insight}
      </InsightCallout>

      {/* SECTION 4: Re-evaluation Alert */}
      <ChartCard title="Re-Evaluation Alert" subtitle="47 articles re-scored — quality is degrading">
        <div className="reval-alert">
          <div className="reval-before">
            <div className="label" style={{ fontSize: 12, color: '#9690B0' }}>Original</div>
            <div className="value">{q.reEvaluation.originalAvg}</div>
          </div>
          <div className="reval-arrow">→</div>
          <div className="reval-after">
            <div className="label" style={{ fontSize: 12, color: '#9690B0' }}>Updated</div>
            <div className="value">{q.reEvaluation.updatedAvg}</div>
          </div>
          <div className="reval-drop">{q.reEvaluation.drop}</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={q.reEvaluation.distribution} margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="range" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pct" name="% of Articles">
              {q.reEvaluation.distribution.map((d, i) => (
                <Cell key={i} fill={d.pct > 50 ? '#FF4757' : '#FFB020'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <InsightCallout>
        {q.reEvaluation.insight}
      </InsightCallout>

      {/* SECTION 5: User Feedback */}
      <div className="grid-2">
        <ChartCard title="Feedback Coverage" subtitle="Only 36.3% of articles have any user votes">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={feedbackDonut} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                {feedbackDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', fontSize: 13 }}>
            <span style={{ fontWeight: 800, color: '#7B61FF' }}>36.3%</span> with feedback • <span style={{ fontWeight: 800, color: '#9690B0' }}>63.7%</span> without
          </div>
        </ChartCard>

        <ChartCard title="Upvote Rate (3+ votes)" subtitle="54 articles with reliable ratings">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={uf.reliableRatings.tiers} margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="tier" tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Articles">
                {uf.reliableRatings.tiers.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 5C: Worst-rated articles */}
      <ChartCard title="Worst-Rated Articles (3+ votes)" subtitle="Lowest upvote rates — these articles actively fail users">
        <div style={{ overflowX: 'auto' }}>
          <table className="intent-fix-table">
            <thead>
              <tr>
                <th>Article</th>
                <SortHeader label="Votes" field="votes" sortKey={wSK} sortDir={wSD} toggle={wToggle} />
                <SortHeader label="Upvote %" field="upRate" sortKey={wSK} sortDir={wSD} toggle={wToggle} />
                <SortHeader label="Views" field="views" sortKey={wSK} sortDir={wSD} toggle={wToggle} />
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {worstSorted.map((a, i) => (
                <tr key={i} style={a.views > 100 ? { background: 'rgba(255,71,87,0.06)' } : {}}>
                  <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: a.views > 100 ? 700 : 400 }}>{a.article}</td>
                  <td>{a.votes}</td>
                  <td style={{ fontWeight: 800, color: a.upRate < 30 ? '#FF4757' : '#FFB020' }}>{a.upRate}%</td>
                  <td style={{ fontWeight: 800 }}>{a.views.toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* 5D: Blind Spots */}
      <ChartCard title="Blind Spots — 50+ Views, Zero Feedback" subtitle={`${uf.blindSpots.count} articles with high traffic but no quality signal`}>
        <div style={{ overflowX: 'auto' }}>
          <table className="intent-fix-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Views</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {uf.blindSpots.articles.map((a, i) => (
                <tr key={i}>
                  <td style={{ maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.article}</td>
                  <td style={{ fontWeight: 800 }}>{a.views.toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          Showing top 10 of {uf.blindSpots.count} blind spot articles
        </div>
      </ChartCard>

      <InsightCallout>
        {uf.feedbackDesert}
      </InsightCallout>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 3: SUPPLY vs DEMAND
   ═══════════════════════════════════════════════════ */
function SupplyDemandTab() {
  const sd = kbData.supplyDemand;
  const { sorted: catSorted, sortKey: cSK, sortDir: cSD, toggle: cToggle } = useSortable(sd.categories, 'views');

  // Scatter data — filter to those with searchDemand
  const scatterData = sd.categories
    .filter(c => c.searchDemand != null)
    .map(c => ({
      name: c.category,
      x: c.searchDemand,
      y: c.articles,
      z: c.views,
      type: c.demandType,
      fill: c.demandType === 'Operational' ? '#FF4757' : '#7B61FF',
    }));

  return (
    <div className="section-gap">
      {/* 6A: Demand-Supply Scatter */}
      <ChartCard title="Demand vs Supply" subtitle="X = Search demand, Y = KB articles. Red = Operational, Blue = Product">
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis type="number" dataKey="x" name="Search Demand" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
              label={{ value: 'Search Demand', position: 'insideBottom', offset: -10, fill: 'var(--chart-tick)', fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name="KB Articles" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
              label={{ value: 'KB Articles', angle: -90, position: 'insideLeft', fill: 'var(--chart-tick)', fontSize: 11 }} />
            <ZAxis type="number" dataKey="z" range={[80, 600]} name="Views" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{
                  background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)',
                  borderRadius: 8, padding: '10px 14px', fontSize: 12,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                  <div>Search Demand: {d.x?.toLocaleString()}</div>
                  <div>KB Articles: {d.y}</div>
                  <div>Views: {d.z?.toLocaleString()}</div>
                  <div style={{ color: d.fill, fontWeight: 600 }}>{d.type}</div>
                </div>
              );
            }} />
            <Scatter data={scatterData.filter(d => d.type === 'Operational')} fill="#FF4757" name="Operational" />
            <Scatter data={scatterData.filter(d => d.type === 'Product')} fill="#7B61FF" name="Product" />
            <Legend />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 6B: Demand-Supply Ratio Table */}
      <ChartCard title="Demand-Supply Ratios" subtitle="Search volume per KB article — higher ratio = bigger gap">
        <div style={{ overflowX: 'auto' }}>
          <table className="intent-fix-table">
            <thead>
              <tr>
                <th>Intent</th>
                <th>Search Vol</th>
                <th>KB Articles</th>
                <th>Ratio</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {sd.demandSupplyRatios.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{r.intent}</td>
                  <td style={{ fontWeight: 800 }}>{r.searchVol.toLocaleString()}</td>
                  <td>{r.kbArticles}</td>
                  <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: r.verdict.includes('GAP') ? '#FF4757' : '#00D09C' }}>{r.ratio}</td>
                  <td>
                    <span className={`imbalance-pill ${r.verdict === 'EXTREME GAP' ? 'extreme-gap' : r.verdict === 'SEVERE GAP' ? 'severe-gap' : r.verdict === 'GAP' ? 'gap' : 'balanced'}`}>
                      {r.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <InsightCallout>
        Transactions: 8,540 searches served by 6 articles (1,423:1 ratio). Crypto Futures: 627 searches served by 77 articles (8:1 ratio). The KB has 13× more content for the topic with 14× less demand.
      </InsightCallout>

      {/* 6C: Category Detail Table */}
      <ChartCard title="Category Supply & Demand" subtitle="Full category-level view — sortable">
        <div style={{ overflowX: 'auto' }}>
          <table className="intent-fix-table">
            <thead>
              <tr>
                <SortHeader label="Category" field="category" sortKey={cSK} sortDir={cSD} toggle={cToggle} />
                <SortHeader label="Articles" field="articles" sortKey={cSK} sortDir={cSD} toggle={cToggle} />
                <SortHeader label="Views" field="views" sortKey={cSK} sortDir={cSD} toggle={cToggle} />
                <SortHeader label="Search Demand" field="searchDemand" sortKey={cSK} sortDir={cSD} toggle={cToggle} />
                <SortHeader label="Avg Score" field="avgScore" sortKey={cSK} sortDir={cSD} toggle={cToggle} />
                <th>Type</th>
                <th>Imbalance</th>
              </tr>
            </thead>
            <tbody>
              {catSorted.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{c.category}</td>
                  <td>{c.articles}</td>
                  <td style={{ fontWeight: 800 }}>{c.views.toLocaleString()}</td>
                  <td>{c.searchDemand != null ? c.searchDemand.toLocaleString() : '—'}</td>
                  <td style={{ color: c.avgScore != null ? (c.avgScore < 6 ? '#FF4757' : '#00D09C') : 'var(--text-muted)' }}>
                    {c.avgScore != null ? c.avgScore : '—'}
                  </td>
                  <td>
                    <span style={{
                      background: c.demandType === 'Operational' ? 'rgba(255,71,87,0.1)' : 'rgba(59,130,246,0.1)',
                      color: c.demandType === 'Operational' ? '#FF4757' : '#7B61FF',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    }}>
                      {c.demandType}
                    </span>
                  </td>
                  <td><ImbalancePill imbalance={c.imbalance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Section 7: Language Gap Note */}
      <InsightCallout>
        20.8% of searches are in English. Many high-traffic articles exist only in Indonesian. The top articles have EN duplicates, but these are often lower quality.
      </InsightCallout>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 4: PRIORITY QUEUE (ARPI)
   ═══════════════════════════════════════════════════ */
function PriorityQueueTab() {
  const arpi = kbData.arpiFramework;
  const { methodology, actionQueues } = arpi;

  const queueStyles = {
    'FIX FIRST': 'fix',
    'REVIEW (Blind Spots)': 'review',
    'CREATE': 'create',
    'RETIRE': 'retire',
  };

  return (
    <div className="section-gap">
      {/* SECTION 8: ARPI Methodology Card */}
      <div className="arpi-card">
        <div className="title">ARTICLE REVIEW PRIORITY INDEX (ARPI) v{arpi.version}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          {methodology.description}
        </div>

        <div className="formula">
          {methodology.priorityFormula.withEffectiveness}
        </div>

        <div className="arpi-dimensions">
          {methodology.dimensions.map(d => (
            <div key={d.name} className="arpi-dim-card">
              <div className="dim-name">{d.name}</div>
              <div className="dim-formula">{d.formula}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', margin: '6px 0' }}>{d.rationale}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{d.example}</div>
              {d.caveat && <div style={{ fontSize: 11, color: '#FF4757', marginTop: 4 }}>{d.caveat}</div>}
              <div className="dim-source">Source: {d.dataSource}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-hover)', borderRadius: 10, fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Interpretation:</div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div>High D × High V × Low E = <strong style={{ color: '#FF4757' }}>FIX FIRST</strong></div>
            <div>High D × High V × Unknown E = <strong style={{ color: '#FFB020' }}>REVIEW FIRST</strong></div>
            <div>High D × No article = <strong style={{ color: '#00D09C' }}>CREATE FIRST</strong></div>
            <div>Low D × Low V = <strong style={{ color: '#9690B0' }}>RETIRE</strong></div>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: 16, border: '1px solid var(--border)', borderRadius: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Quality Score (Bonus, category-level):</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            {methodology.qualityBonus.formula}
          </div>
          {methodology.qualityBonus.weights.map(w => (
            <div key={w.dimension} className="weight-row">
              <span style={{ minWidth: 100, fontWeight: 600, fontSize: 13 }}>{w.dimension}</span>
              <div className="weight-bar" style={{ width: `${w.weight * 200}px`, background: w.weight > 0.3 ? '#FF4757' : w.weight > 0.15 ? '#FFB020' : '#7B61FF' }}>
                {(w.weight * 100)}%
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>{w.why}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#FFB020', marginTop: 8 }}>{methodology.qualityBonus.caveat}</div>
        </div>
      </div>

      {/* SECTION 9: Priority Queue Cards */}
      {actionQueues.map((aq, qi) => {
        const style = queueStyles[aq.queue] || 'retire';
        return (
          <div key={qi} className={`queue-card ${style}`}>
            <div className="queue-header">
              <div className="queue-title">{aq.emoji} {aq.queue}</div>
              <div className="queue-count">{aq.count || (aq.gaps ? aq.gaps.length : '—')} items</div>
            </div>
            <div className="queue-criteria">{aq.criteria}</div>
            <div className="queue-action">Action: {aq.action}</div>

            {/* Fix/Review articles */}
            {aq.articles && (
              <div style={{ overflowX: 'auto' }}>
                <table className="intent-fix-table">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Views</th>
                      {aq.articles[0]?.upRate != null && <th>Upvote %</th>}
                      {aq.articles[0]?.votes != null && <th>Votes</th>}
                      <th>Category</th>
                      {aq.articles[0]?.arpiScore && <th>ARPI</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {aq.articles.map((a, i) => (
                      <tr key={i}>
                        <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{a.article}</td>
                        <td style={{ fontWeight: 800 }}>{a.views.toLocaleString()}</td>
                        {a.upRate != null && <td style={{ fontWeight: 700, color: a.upRate < 50 ? '#FF4757' : '#FFB020' }}>{a.upRate}%</td>}
                        {a.votes != null && <td>{a.votes}</td>}
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.category}</td>
                        {a.arpiScore && (
                          <td>
                            <span style={{
                              background: a.arpiScore === 'HIGH' ? 'rgba(255,71,87,0.15)' : 'rgba(245,158,11,0.15)',
                              color: a.arpiScore === 'HIGH' ? '#FF4757' : '#FFB020',
                              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                            }}>
                              {a.arpiScore}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Create gaps */}
            {aq.gaps && (
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {aq.gaps.map((g, i) => (
                  <div key={i} style={{
                    padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(5,150,105,0.2)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{g.intent}</span>
                      <span style={{ fontWeight: 800, color: '#FF4757', fontSize: 16 }}>{g.searchVol.toLocaleString()} searches</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Current: {g.currentArticles} articles • <span style={{ color: '#FF4757' }}>{g.gap}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Retire stats */}
            {aq.stats && (
              <div className="grid-2" style={{ marginTop: 8 }}>
                <ChartCard>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#9690B0' }}>{aq.stats.ghostArticles}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ghost Articles (0–1 views)</div>
                  </div>
                </ChartCard>
                <ChartCard>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#9690B0' }}>{aq.stats.dormantArticles}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dormant Articles (2–10 views)</div>
                  </div>
                </ChartCard>
              </div>
            )}

            {aq.note && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {aq.note}
              </div>
            )}
          </div>
        );
      })}

      {/* SECTION 10: Weight Justification */}
      <ChartCard title="ARPI Weight Justification" subtitle="Why these weights were chosen">
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { label: 'Usefulness weighted 40%', reason: 'Self-service resolution is the goal. If content doesn\'t resolve the issue, nothing else matters.' },
            { label: 'Accuracy weighted 10%', reason: 'Already high at 8.2 average — not the bottleneck. Low weight avoids over-rewarding correct-but-useless content.' },
            { label: 'Effectiveness uses ≥3 vote threshold', reason: 'Avoids noise from 1–2 vote articles. A single upvote on a 1-vote article shouldn\'t mark it as "effective."' },
            { label: 'Log normalization on views', reason: 'Prevents the #1 article (1,457 views) from making everything else invisible. A 100-view article still has V = 0.54.' },
          ].map((w, i) => (
            <div key={i} style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--bg-hover)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{w.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.reason}</div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB 5: INSTRUMENTATION
   ═══════════════════════════════════════════════════ */
function InstrumentationTab() {
  const inst = kbData.instrumentation;
  const src = kbData.source;

  return (
    <div className="section-gap">
      <div style={{
        padding: 24, borderRadius: 16, background: 'rgba(255,71,87,0.06)',
        border: '1px solid rgba(255,71,87,0.15)', textAlign: 'center', marginBottom: 8,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{inst.headline}</div>
      </div>

      {/* 11A: Gap Cards */}
      {inst.gaps.map((g, i) => (
        <div key={i} className="gap-card">
          <div className="gap-title">{g.gap}</div>
          <div className="gap-impact">Impact: {g.impact}</div>
          <div className="gap-fix">Fix: {g.fix}</div>
          <div className="gap-meta">
            <EffortBadge effort={g.effort} />
            <span style={{ color: 'var(--text-muted)' }}>Owner: {g.owner}</span>
          </div>
        </div>
      ))}

      {/* 11B: Current vs Target */}
      <div className="current-vs-target">
        <div className="cvt-card have">
          <div className="card-title">What We Have</div>
          {inst.currentState.whatWeHave.map((item, i) => (
            <div key={i} className="cvt-item">✅ {item}</div>
          ))}
        </div>
        <div className="cvt-card need">
          <div className="card-title">What We Need</div>
          {inst.currentState.whatWeMiss.map((item, i) => (
            <div key={i} className="cvt-item missing">❌ {item}</div>
          ))}
        </div>
      </div>

      {/* 11C: Data Footer */}
      <ChartCard title="Data Sources & Methodology">
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Primary: {src.primary}</div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>Secondary:</span>
            <ul style={{ margin: '4px 0 8px 16px' }}>
              {src.secondary.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Methodology:</div>
          <ul style={{ margin: '4px 0 0 16px', lineHeight: 1.8 }}>
            {src.methodology.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      </ChartCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
const TABS = [
  { key: 'ghost', label: 'The Ghost Library' },
  { key: 'quality', label: 'Content Quality' },
  { key: 'supply', label: 'Supply vs Demand' },
  { key: 'arpi', label: 'Priority Queue (ARPI)' },
  { key: 'instrumentation', label: 'Instrumentation' },
];

export default function KBHealthDeepDive() {
  const [tab, setTab] = useState('ghost');
  const hero = kbData.hero;

  return (
    <div className="page">
      {/* Hero Banner */}
      <div className="email-hero">
        <h1>{hero.title}</h1>
        <div className="tagline">{hero.subtitle}</div>
        <div className="hero-metrics">
          {hero.metrics.map(m => (
            <div key={m.label} className={`metric-card ${m.status === 'critical' ? 'critical' : ''}`}
              style={m.status === 'critical' ? { border: '2px solid #FF4757' } : {}}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
              <div className="value">{m.value}</div>
              <div className="label">{m.label}</div>
              <div className="subtext">{m.subtext}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* Tab Content */}
      {tab === 'ghost' && <GhostLibraryTab />}
      {tab === 'quality' && <ContentQualityTab />}
      {tab === 'supply' && <SupplyDemandTab />}
      {tab === 'arpi' && <PriorityQueueTab />}
      {tab === 'instrumentation' && <InstrumentationTab />}
    </div>
  );
}
