import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import MetricCard from '../../components/MetricCard';
import ChartCard from '../../components/ChartCard';
import AlertBanner from '../../components/AlertBanner';
import TabBar from '../../components/TabBar';
import ProgressBar from '../../components/ProgressBar';
import DataSourceLabel from '../../components/DataSourceLabel';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundaryCard from '../../components/ErrorBoundaryCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell,
} from 'recharts';
import {
  Bot, AlertTriangle, TrendingDown, MessageCircle, Target, Shield, Search,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, X,
} from 'lucide-react';

// ══════════════════════════════════════════════
// STATIC DATA (from task spec — validated numbers)
// ══════════════════════════════════════════════

const DETECTOR_DEFINITIONS = [
  {
    name: 'Failure Phrase', what: 'Bot admits it cannot help or apologizes for inability',
    patterns: ['maaf', 'tidak dapat', 'hubungi tim', 'contact support', 'tidak bisa membantu', 'cannot help', 'unable to', 'tim dukungan', 'customer service kami', 'tidak menemukan', 'sorry', 'apologize'],
    appliedTo: 'Bot messages only', key: 'failure',
  },
  {
    name: 'Dead-End Redirect', what: 'LAST bot message contains "contact support" or equivalent',
    patterns: ['hubungi tim dukungan', 'contact support', 'hubungi customer service', 'menghubungi tim', 'silakan hubungi', 'please contact'],
    appliedTo: 'Last bot message per session', key: 'deadEnd',
  },
  {
    name: 'User Frustration', what: 'User messages contain frustration/anger indicators',
    patterns: ['kenapa', 'masih', 'tidak bisa', 'gagal', 'kesal', 'marah', 'kecewa', 'useless', 'terrible', 'worst', 'broken', 'not working', 'sudah lama', '!!!', 'manusia', 'orang'],
    appliedTo: 'User messages only', key: 'frustration',
  },
  {
    name: 'Response Loop', what: 'Bot sends identical or near-identical response 2+ times',
    patterns: ['String equality check on bot messages within session (exact match)'],
    appliedTo: 'Bot messages grouped by session', key: 'loop',
  },
  {
    name: 'Escalation Request', what: 'User explicitly asks for human agent',
    patterns: ['agent', 'manusia', 'orang', 'human', 'customer service', 'bicara dengan', 'connect', 'transfer', 'live chat', 'speak to'],
    appliedTo: 'User messages only', key: 'escalation',
  },
  {
    name: 'Resolution Indicator', what: 'Session contains thank-you or completion language',
    patterns: ['berhasil', 'selesai', 'sudah selesai', 'resolved', 'completed', 'done', 'terima kasih', 'thank you', 'thanks', 'makasih', 'solved'],
    appliedTo: 'All messages (user gratitude = proxy for resolution)', key: 'resolution',
  },
];

const FAILURE_MODES = [
  { rank: 1, mode: 'Dead-End Redirect', sessions: 8595, pct: 57.8, color: '#FF4757',
    description: 'Bot says "cannot help" or "contact support" \u2014 circular redirect to the channel user is already on',
    evidence: '#1 response: "Maaf, saya tidak dapat menemukan informasi..." \u2014 1,715 occurrences alone',
    opsImpact: 'Users leave unresolved \u2192 re-enter via email/phone \u2192 creates duplicate ticket' },
  { rank: 2, mode: 'Apology Without Action', sessions: 4568, pct: 17.8, color: '#FF6B6B',
    description: 'Bot apologizes but provides no redirect, no KB article, no next step \u2014 just sorry',
    evidence: '4,568 bot messages contain apology phrases without any dead-end redirect',
    opsImpact: 'User stuck \u2014 no clear exit, no resolution, no escalation offer' },
  { rank: 3, mode: 'User Frustration (undetected)', sessions: 4279, pct: 28.8, color: '#FF4757',
    description: 'User expresses frustration \u2014 bot continues scripted responses with no de-escalation',
    evidence: '28.8% of sessions contain frustration keywords. Zero frustration-triggered escalation exists.',
    opsImpact: 'Frustrated users become detractors \u2014 51% frustration rate for complaint intent' },
  { rank: 4, mode: 'Response Loop', sessions: 1008, pct: 6.8, color: '#FFB020',
    description: 'Bot sends identical response 2+ times \u2014 no loop-break logic exists',
    evidence: 'User said "not getting OTP" 3 times \u2192 bot gave identical 150-word response each time',
    opsImpact: 'Peak frustration \u2014 78% of looped sessions show escalation language' },
  { rank: 5, mode: 'Verbose Overload', sessions: 7734, pct: 52.0, color: '#FFB020',
    description: 'Bot responses average 954 chars \u2014 2-3x industry best practice (300-500 chars)',
    evidence: '13,408 bot messages (52.3%) exceed 1,000 characters. Median = 1,015 chars.',
    opsImpact: 'Users don\'t read wall-of-text responses \u2192 ask again \u2192 bot loops' },
];

const TOP_FAILURE_RESPONSES = [
  { rank: 1, text: 'Maaf, saya tidak dapat menemukan informasi yang relevan untuk pertanyaan Anda. Bisakah Anda mengulang pertanyaan atau menghubungi tim dukungan kami...', occurrences: 1715, pattern: 'Circular redirect', fix: 'Replace with intent-specific KB lookup + guided flow entry point', impact: 'Fixing this ONE response template fixes 11.5% of all failures' },
  { rank: 2, text: 'Mohon maaf, saya tidak dapat membantu Anda untuk mengubah PIN Anda di aplikasi Pluang...', occurrences: 82, pattern: 'Hard capability gap \u2014 PIN change', fix: 'Add system integration for PIN change flow OR direct agent routing' },
  { rank: 3, text: 'Baik, saya dapat membantu Anda untuk mengubah nomor telepon yang terdaftar di akun Pluang Anda...', occurrences: 65, pattern: 'False promise \u2014 gives steps user already tried', fix: 'Detect if user already attempted steps \u2192 skip to escalation' },
  { rank: 4, text: 'Baik, saya dapat membantu Anda untuk menonaktifkan akun Pluang Anda...', occurrences: 64, pattern: 'Account deactivation \u2014 requires system action', fix: 'Route to specialist agent with account context pre-loaded' },
  { rank: 5, text: 'Mohon maaf atas kendala yang Anda alami saat login ke aplikasi Pluang...', occurrences: 59, pattern: 'Login issue \u2014 generic troubleshooting', fix: 'Add backend check: is account locked? Is device blocked?' },
  { rank: 6, text: 'Baik, saya dapat membantu Anda untuk mengaktifkan kembali akun Pluang...', occurrences: 56, pattern: 'Account reactivation \u2014 requires backend action', fix: 'Add reactivation API call or one-click specialist routing' },
  { rank: 7, text: 'Mohon maaf atas ketidaknyamanan... Apabila setelah 1x24 jam sejak top up E-wallet...', occurrences: 44, pattern: 'Time-gated response \u2014 no status check', fix: 'Add backend status check: if pending > 24h, auto-escalate' },
  { rank: 8, text: 'Baik, saya dapat membantu Anda dengan proses menghapus akun Pluang...', occurrences: 38, pattern: 'Account deletion \u2014 requires compliance verification', fix: 'Add identity verification flow \u2192 automated deletion request' },
];

const MATURITY_PILLARS = [
  { pillar: 'P1: Conversation Quality', score: 2.3, maxScore: 5.0, params: 7, worstParam: 'Response Accuracy (2.0)', bestParam: 'Ambiguity Handling (3.0)' },
  { pillar: 'P2: UX & Interaction Design', score: 2.8, maxScore: 5.0, params: 7, worstParam: 'Onboarding (1.5)', bestParam: 'Input Modalities (3.5)' },
  { pillar: 'P3: Problem-Solving Coverage', score: 2.5, maxScore: 5.0, params: 6, worstParam: 'Proactive Resolution (1.5)', bestParam: 'Knowledge Retrieval (3.5)' },
  { pillar: 'P4: NLP/Intent & RAG Quality', score: 3.0, maxScore: 5.0, params: 6, worstParam: 'Multi-Intent Handling (2.0)', bestParam: 'Language Detection (4.0)' },
  { pillar: 'P5: Automation & Escalation', score: 2.2, maxScore: 5.0, params: 5, worstParam: 'Context Transfer (1.5)', bestParam: 'Escalation UX (2.0)' },
  { pillar: 'P6: Architecture & Scalability', score: 3.2, maxScore: 5.0, params: 5, worstParam: 'Fault Tolerance (3.0)', bestParam: 'Extensibility (3.5)' },
  { pillar: 'P7: Governance & Observability', score: 2.5, maxScore: 5.0, params: 6, worstParam: 'Metrics & Monitoring (2.0)', bestParam: 'Logging (3.5)' },
];

const TARGETS = [
  { metric: 'True Resolution Rate', current: '5.1%', target: '>25%', direction: '\u25b2', owner: 'Bot/Eng', star: true },
  { metric: 'Failure Phrase Rate', current: '81.0%', target: '<50%', direction: '\u25bc', owner: 'Bot/Eng' },
  { metric: 'Dead-End Redirect Rate', current: '57.8%', target: '<30%', direction: '\u25bc', owner: 'Bot/Eng' },
  { metric: 'Pre-Handoff Slot Score', current: '1.02/6', target: '>4/6', direction: '\u25b2', owner: 'Bot/Eng' },
  { metric: 'Context Summary Rate', current: '0.9%', target: '>90%', direction: '\u25b2', owner: 'Bot/Eng' },
  { metric: 'Loop Rate', current: '6.8%', target: '<1%', direction: '\u25bc', owner: 'Bot/Eng' },
  { metric: 'User Frustration Rate', current: '28.8%', target: '<10%', direction: '\u25bc', owner: 'CS Ops' },
  { metric: 'Escalation Request Rate', current: '9.8%', target: '<3%', direction: '\u25bc', owner: 'CS Ops' },
  { metric: 'Avg Session Depth', current: '3.45', target: '>5 msgs', direction: '\u25b2', owner: 'Product' },
  { metric: 'Verbose Rate (>1000c)', current: '52.3%', target: '<20%', direction: '\u25bc', owner: 'Bot/Eng' },
];

// ══════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════

const cardStyle = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '16px',
};

const heatColor = (val) => {
  const n = parseFloat(val);
  if (n >= 75) return '#FF4757';
  if (n >= 50) return '#FFB020';
  return '#00D09C';
};

const scoreColor = (score) => {
  if (score <= 3) return '#FF4757';
  if (score <= 6) return '#FFB020';
  return '#00D09C';
};

const scoreBgColor = (score) => {
  if (score <= 3) return 'rgba(255,71,87,0.1)';
  if (score <= 6) return 'rgba(255,176,32,0.1)';
  return 'rgba(0,208,156,0.1)';
};

// ══════════════════════════════════════════════
// HIGHLIGHT UTILITY
// ══════════════════════════════════════════════

const FAILURE_RX = /maaf|tidak dapat|hubungi tim|contact support|tidak bisa membantu|cannot help|unable to|tim dukungan|customer service kami|tidak menemukan|sorry|apologize/gi;
const FRUSTRATION_RX = /kenapa|masih|tidak bisa|gagal|kesal|marah|kecewa|useless|terrible|worst|broken|not working|sudah lama|!!!|manusia/gi;
const RESOLUTION_RX = /berhasil|selesai|sudah selesai|resolved|completed|done|terima kasih|thank you|thanks|makasih|solved/gi;

function highlightText(text, sender) {
  if (!text) return text;
  const rx = sender === 'assistant' ? FAILURE_RX : sender === 'user' ? FRUSTRATION_RX : null;
  const parts = [];
  let last = 0;

  // Apply failure/frustration highlights
  if (rx) {
    rx.lastIndex = 0;
    let match;
    while ((match = rx.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index));
      const color = sender === 'assistant' ? '#FF4757' : '#FF6B6B';
      parts.push(<span key={match.index} style={{ background: `${color}33`, color, fontWeight: 600, borderRadius: 2, padding: '0 2px' }}>{match[0]}</span>);
      last = rx.lastIndex;
    }
  }

  // Apply resolution highlights
  if (last < text.length) {
    const remaining = text.slice(last);
    RESOLUTION_RX.lastIndex = 0;
    let match2;
    let last2 = 0;
    while ((match2 = RESOLUTION_RX.exec(remaining)) !== null) {
      if (match2.index > last2) parts.push(remaining.slice(last2, match2.index));
      parts.push(<span key={`r${last + match2.index}`} style={{ background: 'rgba(0,208,156,0.2)', color: '#00D09C', fontWeight: 600, borderRadius: 2, padding: '0 2px' }}>{match2[0]}</span>);
      last2 = RESOLUTION_RX.lastIndex;
    }
    if (last2 < remaining.length) parts.push(remaining.slice(last2));
  }

  return parts.length > 0 ? parts : text;
}


// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════

export default function ChatbotDeepDive() {
  const [tab, setTab] = useState('analysis');
  const { data, loading, error, refetch } = useApi('/api/intelligence/chatbot-analysis');

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">Chatbot Deep Dive</div>
        {data && <DataSourceLabel source={data._source} updated={data._updated} processedAt={data._processedAt} />}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Source: Chat_transcripts_chatbot_only.xlsx | 14,875 sessions | 51,266 messages | 25,633 bot responses | Oct 2025 – Jan 2026
      </div>

      <TabBar
        tabs={[
          { key: 'analysis', label: 'Analysis' },
          { key: 'transcripts', label: 'Transcript Analysis' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'analysis' && <AnalysisTab data={data} loading={loading} error={error} refetch={refetch} />}
      {tab === 'transcripts' && <TranscriptTab />}
    </div>
  );
}


// ══════════════════════════════════════════════
// TAB 1: ANALYSIS
// ══════════════════════════════════════════════

function AnalysisTab({ data, loading, error, refetch }) {
  if (loading) return <LoadingSpinner message="Loading chatbot analysis..." />;
  if (error) return <ErrorBoundaryCard error={error} onRetry={refetch} />;
  if (!data) return null;

  const d = data.detectors || {};

  return (
    <div className="section-gap">
      {/* 1A: Scoring Model */}
      <ScoringModelSection detectors={d} totalSessions={data.totalSessions} />

      {/* 1B: Headline Metrics */}
      <HeadlineMetrics data={data} />

      {/* 1C: Failure Taxonomy */}
      <FailureTaxonomy />

      {/* 1D: Intent Cross-Tab */}
      <IntentCrossTab data={data} />

      {/* 1E: Bot Response Classification */}
      <BotResponseClassification data={data} />

      {/* 1F: Session Funnel */}
      <SessionFunnel data={data} />

      {/* 1G: Maturity Scores */}
      <MaturityScores />

      {/* 1H: Operational Targets */}
      <OperationalTargets />
    </div>
  );
}


// ── 1A: Scoring Model ──

function ScoringModelSection({ detectors, totalSessions }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
        How We Scored 14,875 Bot Sessions
      </div>

      {/* Containment Paradox Callout */}
      <div style={{
        background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)',
        borderRadius: 8, padding: 16, marginBottom: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#FF4757', marginBottom: 8 }}>The Containment Paradox</div>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
          The dashboard shows <strong>100% containment</strong> and <strong>0% failure</strong>. Both are wrong.
          Containment = "user didn't get transferred to an agent." This is true for 91.4% of sessions (SF data confirms 22,372 bot-only sessions).
          But <strong>containment ≠ resolution</strong>. When we analyze the actual transcript text, <strong>81.0% of sessions contain failure/apology phrases</strong>.
          The bot "contains" users by apologizing and redirecting — not by solving problems.
        </div>
      </div>

      {/* Session Scoring Framework */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Session Scoring Framework</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>6 binary detectors applied to every session:</div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Detector', 'What It Detects', 'Patterns', 'Applied To', 'Result', 'Interpretation'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DETECTOR_DEFINITIONS.map((det, i) => {
              const live = detectors[det.key];
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text)' }}>{det.name}</td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)', maxWidth: 200 }}>{det.what}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', maxWidth: 250, wordBreak: 'break-word' }}>
                    {det.patterns.join(', ')}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{det.appliedTo}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: det.key === 'resolution' ? 'var(--accent-amber)' : '#FF4757' }}>
                    {live ? `${live.rate}% (${live.count.toLocaleString()})` : '\u2014'}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)', maxWidth: 250 }}>
                    {det.key === 'failure' && `Bot confesses failure in ~4 out of 5 sessions`}
                    {det.key === 'deadEnd' && `Majority of conversations end with bot sending user elsewhere`}
                    {det.key === 'frustration' && `Nearly 1 in 3 users show frustration during bot interaction`}
                    {det.key === 'loop' && `Bot gets stuck in loops with no break logic`}
                    {det.key === 'escalation' && `1 in 10 users give up and ask for a human`}
                    {det.key === 'resolution' && `Inflated \u2014 many "terima kasih" are polite exits, not genuine resolution`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Resolution Warning Box */}
      <div style={{
        background: 'rgba(255,176,32,0.08)', border: '1px solid rgba(255,176,32,0.3)',
        borderRadius: 8, padding: 14, marginTop: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#FFB020', marginBottom: 6 }}>
          Why "Resolution" at {detectors.resolution?.rate || 55.1}% is misleading
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Indonesian culture uses "terima kasih" (thank you) as a conversation closer even when unsatisfied.
          81% have failure phrases AND ~55% have resolution phrases — meaning ~36% of sessions contain BOTH.
          These are polite exits from failed interactions, not genuine resolutions.
          The earlier transcript audit estimated <strong>true resolution at 5.1%</strong> using stricter completion indicators. We use 5.1% as the validated number.
        </div>
      </div>
    </div>
  );
}


// ── 1B: Headline Metrics ──

function HeadlineMetrics({ data }) {
  const d = data.detectors || {};
  return (
    <>
      <div className="grid-5">
        <MetricCard label="Total Sessions" value={(data.totalSessions || 14875).toLocaleString()} icon={Bot} color="blue" />
        <MetricCard label="Failure Phrase Rate" value={`${d.failure?.rate || 81.0}%`} subtitle={`${(d.failure?.count || 12048).toLocaleString()} sessions`} icon={AlertTriangle} color="red" />
        <MetricCard label="Dead-End Redirect" value={`${d.deadEnd?.rate || 57.8}%`} subtitle={`${(d.deadEnd?.count || 8595).toLocaleString()} sessions`} icon={TrendingDown} color="red" />
        <MetricCard label="True Resolution" value="5.1%" subtitle="Validated (was showing 100%)" icon={Target} color="red" />
        <MetricCard label="Avg Session Depth" value={data.avgSessionDepth || '3.45'} subtitle="messages" icon={MessageCircle} color="amber" />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>REPORTED vs ACTUAL</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 12 }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Containment: </span>
            <span style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>91.4% </span>
            <span style={{ color: 'var(--text-muted)' }}>(SF) → </span>
            <span style={{ color: '#FF4757', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>5.1% </span>
            <span style={{ color: 'var(--text-muted)' }}>(true resolution) = </span>
            <span style={{ color: '#FF4757', fontWeight: 700 }}>86.3pp gap</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Failure: </span>
            <span style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>"0%" </span>
            <span style={{ color: 'var(--text-muted)' }}>(dashboard) → </span>
            <span style={{ color: '#FF4757', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{d.failure?.rate || 81.0}% </span>
            <span style={{ color: 'var(--text-muted)' }}>(transcript) = dashboard was not analyzing text</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Bot-to-Agent: </span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>8.4% </span>
            <span style={{ color: 'var(--text-muted)' }}>(SF: 2,048) → User-requested: </span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{d.escalation?.rate || 9.8}% </span>
            <span style={{ color: 'var(--text-muted)' }}>({(d.escalation?.count || 1456).toLocaleString()} asked)</span>
          </div>
        </div>
      </div>
    </>
  );
}


// ── 1C: Failure Taxonomy ──

function FailureTaxonomy() {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Five Failure Modes — How the Bot Breaks Down</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {FAILURE_MODES.map(fm => (
          <div key={fm.rank} style={{
            background: `${fm.color}0D`, border: `1px solid ${fm.color}40`,
            borderRadius: 8, padding: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: fm.color, color: '#fff', fontWeight: 700, fontSize: 11, borderRadius: 4, padding: '2px 8px' }}>#{fm.rank}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: fm.color }}>{fm.mode}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: fm.color }}>
                {fm.sessions.toLocaleString()} sessions ({fm.pct}%)
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 6 }}>{fm.description}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              <strong>Evidence:</strong> {fm.evidence}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <strong>Ops Impact:</strong> {fm.opsImpact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── 1D: Intent Cross-Tab ──

function IntentCrossTab({ data }) {
  const crossTab = data.intentCrossTab || [];

  const INTENT_PRIORITY = {
    account_issue: 'P0 \u2014 Highest volume \u00d7 highest failure = #1 fix target',
    query: 'P1 \u2014 High volume, moderate failure \u2014 KB improvement territory',
    complaint: 'P0 \u2014 94% failure \u00d7 51% frustration = zero de-escalation capability',
    greeting: 'P2 \u2014 Small volume but 26% escalation = users came for a human',
    follow_up: 'P2 \u2014 Users returning from prior failure \u2014 bot can\'t track continuity',
    feature_request: 'P3 \u2014 Low volume, moderate failure',
    clarification: 'P2 \u2014 Bot struggles with follow-up context',
  };

  const INTENT_QUERIES = {
    account_issue: 'lupa pin, tidak bisa login, hapus akun, akun terblokir, ubah nomor telepon',
    query: 'live chat, tarik saldo, cara topup, harga emas',
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
        Where Failures Concentrate — The Most Actionable Output
      </div>
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Intent', 'Sessions', '% Total', 'Failure %', 'Dead-End %', 'Frustration %', 'Loop %', 'Escalation %', 'Resolution %', 'Priority'].map(h => (
                <th key={h} style={{ padding: '8px 6px', textAlign: h === 'Priority' ? 'left' : 'center', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crossTab.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 6px', fontWeight: 600, color: 'var(--text)' }}>{row.intent}</td>
                <td style={{ padding: '8px 6px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{row.sessions.toLocaleString()}</td>
                <td style={{ padding: '8px 6px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{row.pctTotal}%</td>
                {['failureRate', 'deadEndRate', 'frustrationRate', 'loopRate', 'escalationRate', 'resolutionRate'].map(k => (
                  <td key={k} style={{
                    padding: '8px 6px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600,
                    color: heatColor(row[k]),
                  }}>
                    {row[k]}%
                  </td>
                ))}
                <td style={{ padding: '8px 6px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 200 }}>
                  {INTENT_PRIORITY[row.intent] || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Heatmap legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#00D09C', marginRight: 4 }} />&lt;50%</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#FFB020', marginRight: 4 }} />50-75%</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#FF4757', marginRight: 4 }} />&gt;75%</span>
      </div>

      {/* Insight box */}
      <div style={{
        background: 'rgba(123,97,255,0.08)', border: '1px solid rgba(123,97,255,0.3)',
        borderRadius: 8, padding: 14, marginTop: 14,
      }}>
        <div style={{ fontSize: 12, color: 'var(--accent-blue)', lineHeight: 1.6 }}>
          <strong>account_issue</strong> ({crossTab.find(r => r.intent === 'account_issue')?.sessions.toLocaleString() || '7,804'} sessions, {crossTab.find(r => r.intent === 'account_issue')?.failureRate || 90}% failure) is the bot's primary workload and it fails almost every time.
          The top search queries within account_issue (<em>'lupa pin', 'tidak bisa login', 'hapus akun', 'akun terblokir', 'ubah nomor telepon'</em>) are ALL system actions the bot has zero capability to execute.
          Fixing the bot for account_issue alone would impact more users than fixing all other intents combined.
        </div>
      </div>
    </div>
  );
}


// ── 1E: Bot Response Classification ──

function BotResponseClassification({ data }) {
  const brc = data.botResponseClassification || {};
  const totalBot = data.totalBotResponses || 25633;

  const categories = [
    { name: 'Apology + Redirect', count: brc.apologyRedirect?.count || 13660, pct: brc.apologyRedirect?.pct || 53.3, color: '#FF4757', desc: 'Bot apologizes AND redirects to "contact support"' },
    { name: 'Apology Only', count: brc.apologyOnly?.count || 4568, pct: brc.apologyOnly?.pct || 17.8, color: '#FF6B6B', desc: 'Bot apologizes but provides no next step' },
    { name: 'Structured Options', count: brc.structuredOptions?.count || 17282, pct: brc.structuredOptions?.pct || 67.4, color: '#7B61FF', desc: 'Bot gives numbered options (overlaps with other categories)' },
    { name: 'Resolution Phrases', count: brc.resolutionPhrases?.count || 11039, pct: brc.resolutionPhrases?.pct || 43.1, color: '#00D09C', desc: 'Contains "berhasil"/"selesai" (inflated by polite closers)' },
    { name: 'Verbose (>1000c)', count: brc.verbose?.count || 13408, pct: brc.verbose?.pct || 52.3, color: '#7B61FF', desc: 'Wall-of-text responses \u2014 2-3x industry best practice' },
  ];

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
        What the Bot Actually Says — {totalBot.toLocaleString()} Messages Decoded
      </div>

      {/* Stacked bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        {categories.map(cat => (
          <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ minWidth: 140, fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{cat.name}</div>
            <div style={{ flex: 1, height: 24, background: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${cat.pct}%`, height: '100%', background: cat.color, borderRadius: 4, transition: 'width 0.5s' }} />
              <span style={{
                position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)',
                fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: cat.pct > 20 ? '#fff' : 'var(--text)',
              }}>
                {cat.count.toLocaleString()} ({cat.pct}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Failure Responses */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 24, marginBottom: 12 }}>
        Top Failure Responses — Engineering Fix Targets
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TOP_FAILURE_RESPONSES.map(r => (
          <div key={r.rank} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#FF4757', fontWeight: 700, marginRight: 8 }}>#{r.rank}</span>
                <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"{r.text}"</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FF4757', marginLeft: 12, whiteSpace: 'nowrap' }}>
                {r.occurrences}x
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)' }}><strong>Pattern:</strong> {r.pattern}</span>
              <span style={{ color: 'var(--accent-blue)' }}><strong>Fix:</strong> {r.fix}</span>
              {r.impact && <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{r.impact}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── 1F: Session Funnel ──

function SessionFunnel({ data }) {
  const d = data.detectors || {};
  const steps = [
    { label: 'Total Sessions', count: data.totalSessions || 14875, pct: 100, color: 'var(--accent-blue)' },
    { label: 'With Failure Phrase', count: d.failure?.count || 12048, pct: d.failure?.rate || 81.0, color: '#FF4757' },
    { label: 'Dead-End Redirect', count: d.deadEnd?.count || 8595, pct: d.deadEnd?.rate || 57.8, color: '#FF4757' },
    { label: 'User Frustrated', count: d.frustration?.count || 4279, pct: d.frustration?.rate || 28.8, color: '#FF6B6B' },
    { label: 'Escalation Requested', count: d.escalation?.count || 1456, pct: d.escalation?.rate || 9.8, color: '#FFB020' },
    { label: 'Response Loop', count: d.loop?.count || 1008, pct: d.loop?.rate || 6.8, color: '#FFB020' },
    { label: 'True Resolution', count: 757, pct: 5.1, color: '#00D09C' },
  ];

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
        Bot Session Funnel — From Entry to Exit
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {steps.map((step, i) => {
          const widthPct = Math.max(8, step.pct);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ minWidth: 160, fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{step.label}</div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{
                  width: `${widthPct}%`, height: 32, background: `${step.color}20`,
                  borderLeft: `3px solid ${step.color}`, borderRadius: '0 4px 4px 0',
                  display: 'flex', alignItems: 'center', paddingLeft: 10,
                  transition: 'width 0.5s',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: step.color }}>
                    {step.count.toLocaleString()} ({step.pct}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
        Note: Categories overlap — a session can have failure + frustration + dead-end simultaneously.
      </div>
    </div>
  );
}


// ── 1G: Maturity Scores ──

function MaturityScores() {
  const radarData = MATURITY_PILLARS.map(p => ({
    subject: p.pillar.split(':')[0],
    score: p.score,
    fullMark: 5,
  }));

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
        Chatbot Maturity Assessment — 7 Pillars × 42 Parameters
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Overall Score: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FF4757', fontSize: 16 }}>2.5 / 5.0</span>
      </div>

      <div className="grid-2">
        {/* Radar Chart */}
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke="#7B61FF" fill="#7B61FF" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div>
          {MATURITY_PILLARS.map(p => (
            <div key={p.pillar} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ minWidth: 200, fontSize: 12, color: 'var(--text)' }}>{p.pillar}</div>
              <div style={{ flex: 1 }}>
                <ProgressBar
                  value={p.score}
                  max={5}
                  color={p.score >= 3.5 ? 'var(--accent-green)' : p.score >= 2.5 ? 'var(--accent-amber)' : 'var(--accent-red)'}
                  label={`${p.score}/5`}
                  height={14}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pillar detail table */}
      <div style={{ overflowX: 'auto', marginTop: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Pillar', 'Score', 'Params', 'Worst Parameter', 'Best Parameter'].map(h => (
                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATURITY_PILLARS.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '6px 8px', color: 'var(--text)' }}>{p.pillar}</td>
                <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: p.score >= 3.5 ? '#00D09C' : p.score >= 2.5 ? '#FFB020' : '#FF4757' }}>
                  {p.score}/{p.maxScore}
                </td>
                <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{p.params}</td>
                <td style={{ padding: '6px 8px', color: '#FF4757', fontSize: 11 }}>{p.worstParam}</td>
                <td style={{ padding: '6px 8px', color: '#00D09C', fontSize: 11 }}>{p.bestParam}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key audit metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
        {[
          { label: 'Bot Failure Rate', value: '54.4%' },
          { label: 'Frustrated Sessions', value: '31.8%' },
          { label: 'Repetition Loops', value: '16.2%' },
          { label: 'Info-Only Responses', value: '61.4%' },
          { label: 'Onboarding Coverage', value: '0.6%' },
          { label: 'Context Summaries', value: '0.3%' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--bg-primary)', padding: 10, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.label}</div>
            <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text)' }}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── 1H: Operational Targets ──

function OperationalTargets() {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
        Improvement Targets — North Star: True Resolution Rate
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {['Metric', 'Current', 'Target', '', 'Owner'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TARGETS.map((t, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: t.star ? 'rgba(123,97,255,0.05)' : 'transparent' }}>
              <td style={{ padding: '8px 10px', fontWeight: t.star ? 700 : 500, color: 'var(--text)' }}>
                {t.star ? '\u2605 ' : ''}{t.metric}
              </td>
              <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FF4757' }}>{t.current}</td>
              <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00D09C' }}>{t.target}</td>
              <td style={{ padding: '8px 10px', fontSize: 16, color: t.direction === '\u25b2' ? '#00D09C' : '#FF4757' }}>{t.direction}</td>
              <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{t.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// ══════════════════════════════════════════════
// TAB 2: TRANSCRIPT ANALYSIS — Analysis-First Design
// ══════════════════════════════════════════════

function TranscriptTab() {
  const [lookupType, setLookupType] = useState('case');
  const [lookupId, setLookupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const doAnalyze = useCallback(() => {
    if (!lookupId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const params = new URLSearchParams({ type: lookupType, id: lookupId.trim() });
    fetch(`/api/intelligence/chatbot/analyze?${params}`)
      .then(r => {
        if (!r.ok) return r.json().then(d => { throw new Error(d.error || `HTTP ${r.status}`); });
        return r.json();
      })
      .then(d => setResult(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [lookupType, lookupId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') doAnalyze();
  };

  const quickFill = (caseNum) => {
    setLookupType('case');
    setLookupId(caseNum);
  };

  return (
    <div className="section-gap">
      {/* Search Bar */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
          <Search size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Conversation Analyzer
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Look up a conversation from Salesforce, get an instant quality scorecard with key moments highlighted.
        </div>

        {/* Lookup type selector */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {[
            { key: 'case', label: 'Case Number', placeholder: 'e.g. 00410884', icon: '#' },
            { key: 'session', label: 'Session ID', placeholder: 'e.g. 0MwMg00000IxP02', icon: 'S' },
            { key: 'sid', label: 'SID / Session Key', placeholder: 'UUID or encrypted key', icon: 'K' },
          ].map(t => (
            <label key={t.key} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13,
              color: lookupType === t.key ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontWeight: lookupType === t.key ? 600 : 400,
            }}>
              <input
                type="radio" name="lookupType" value={t.key}
                checked={lookupType === t.key}
                onChange={() => setLookupType(t.key)}
                style={{ accentColor: 'var(--accent-blue)' }}
              />
              <span style={{
                display: 'inline-flex', width: 20, height: 20, borderRadius: 4,
                background: lookupType === t.key ? 'var(--accent-blue)' : 'var(--bg-hover)',
                color: lookupType === t.key ? '#fff' : 'var(--text-muted)',
                alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
              }}>{t.icon}</span>
              {t.label}
            </label>
          ))}
        </div>

        {/* Input + button */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={lookupId}
            onChange={e => setLookupId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              lookupType === 'case' ? 'e.g. 00407931' :
              lookupType === 'session' ? 'e.g. 0MwMg00000UNvFkKAL' :
              'UUID or encrypted session key'
            }
            style={{
              flex: 1, padding: '10px 14px', fontSize: 14, fontFamily: 'var(--font-mono)',
              border: '2px solid var(--border)', borderRadius: 8,
              background: 'var(--bg-primary)', color: 'var(--text)',
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            onClick={doAnalyze}
            disabled={loading || !lookupId.trim()}
            style={{
              padding: '10px 24px', fontSize: 14, fontWeight: 600,
              background: loading ? 'var(--bg-hover)' : 'var(--accent-blue)',
              color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer',
              opacity: (!lookupId.trim() || loading) ? 0.5 : 1,
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {/* Data availability notice + quick fill */}
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(255,176,32,0.06)', border: '1px solid rgba(255,176,32,0.2)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#FFB020', marginBottom: 4 }}>
            <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Data Availability Note
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong>Full analysis available</strong> for Live Chat cases created before Jan 1, 2026 (via Live_Chat_Message__c).
            Cases after this date use encrypted messaging and cannot be scored.
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Try these cases:</span>
            {['00407931', '00406223', '00410884', '00401994'].map(cn => (
              <button key={cn} onClick={() => quickFill(cn)} style={{
                padding: '2px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
                background: 'rgba(123,97,255,0.1)', color: '#7B61FF', border: '1px solid rgba(123,97,255,0.2)',
                borderRadius: 4, cursor: 'pointer',
              }}>
                {cn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          ...cardStyle, background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#FF4757" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#FF4757' }}>Analysis Failed</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 8 }}>{error}</div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
          <LoadingSpinner message="Fetching transcript from Salesforce and running analysis..." />
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 48 }}>
          <Search size={40} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 16 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            Enter a Case Number, Session ID, or SID to analyze a conversation
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.7 }}>
            The analyzer will fetch the transcript, score the conversation across 5 dimensions, and highlight the key moments that matter.
          </div>
        </div>
      )}

      {/* ═══ RESULTS ═══ */}
      {result && !loading && (
        <>
          {/* Section A: Conversation Summary Strip */}
          <ConversationSummary session={result.session} messageSource={result._messageSource} />

          {/* Section B: Evaluation Scores */}
          <ScoreGrid scores={result.scores} />

          {/* Section C: Key Moments */}
          <KeyMoments moments={result.keyMoments} />
        </>
      )}
    </div>
  );
}


// ── Section A: Conversation Summary Strip ──

function ConversationSummary({ session, messageSource }) {
  const s = session;

  const outcomeColors = {
    resolved: { bg: 'rgba(0,208,156,0.15)', text: '#00D09C', label: 'Resolved' },
    contained: { bg: 'rgba(123,97,255,0.15)', text: '#7B61FF', label: 'Contained' },
    unresolved: { bg: 'rgba(255,71,87,0.15)', text: '#FF4757', label: 'Unresolved' },
    escalated: { bg: 'rgba(255,176,32,0.15)', text: '#FFB020', label: 'Escalated' },
    abandoned: { bg: 'rgba(150,144,176,0.15)', text: '#9690B0', label: 'Abandoned' },
    unknown: { bg: 'rgba(150,144,176,0.1)', text: '#9690B0', label: 'Unknown' },
  };
  const oc = outcomeColors[s.outcome] || outcomeColors.unknown;

  const agentTypeColors = {
    'Bot only': '#7B61FF',
    'Bot \u2192 Agent': '#FFB020',
    'Agent only': '#14B8A6',
  };

  // Build duration display: show active duration, with session window as subtitle if different
  let durationValue = s.duration || 'N/A';
  let durationSubtitle = null;
  if (s.sessionWindow && s.activeDuration && s.sessionWindow !== s.activeDuration) {
    durationValue = s.activeDuration;
    durationSubtitle = `Session window: ${s.sessionWindow}`;
  }

  const items = [
    { label: 'Session ID', value: s.id || 'N/A', mono: true },
    { label: 'Case Number', value: s.caseNumber || 'No case linked', mono: true },
    { label: 'Date', value: s.dateFormatted || (s.startTime ? new Date(s.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A') },
    { label: 'Active Duration', value: durationValue, subtitle: durationSubtitle },
    { label: 'Total Turns', value: `${s.totalTurns} (${s.userTurns} user, ${s.botTurns} bot${s.agentTurns ? `, ${s.agentTurns} agent` : ''})` },
    { label: 'Agent Type', value: s.agentType, color: agentTypeColors[s.agentType] },
  ];

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
          <Shield size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Conversation Summary
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {messageSource && (
            <span style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 4,
              background: messageSource === 'Live_Chat_Message__c' ? 'rgba(0,208,156,0.15)' : 'rgba(123,97,255,0.15)',
              color: messageSource === 'Live_Chat_Message__c' ? '#00D09C' : '#7B61FF',
              fontWeight: 600,
            }}>
              {messageSource}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
            background: oc.bg, color: oc.text,
          }}>
            {oc.label}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {items.map((item, i) => (
          <div key={i}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{item.label}</div>
            <div style={{
              fontSize: 13, fontWeight: 500,
              color: item.color || 'var(--text)',
              fontFamily: item.mono ? 'var(--font-mono)' : undefined,
              wordBreak: 'break-all',
            }}>{item.value}</div>
            {item.subtitle && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>{item.subtitle}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Section B: Score Grid ──

function ScoreGrid({ scores }) {
  const overallScore = scores.overall.score;
  const overallColor = scoreColor(overallScore);
  const overallBg = scoreBgColor(overallScore);

  const dimensions = [
    { key: 'resolution', label: 'Resolution', weight: '30%' },
    { key: 'effort', label: 'Effort', weight: '25%' },
    { key: 'accuracy', label: 'Bot Accuracy', weight: '20%' },
    { key: 'compliance', label: 'Compliance', weight: '15%' },
    { key: 'escalation', label: 'Escalation Quality', weight: '10%' },
  ];

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
        <Target size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Evaluation Scores
      </div>

      {/* Overall score — hero element */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        padding: '20px 0', marginBottom: 20,
        background: overallBg, borderRadius: 12,
        border: `2px solid ${overallColor}30`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 4,
        }}>
          <span style={{
            fontSize: 48, fontWeight: 800, fontFamily: 'var(--font-mono)',
            color: overallColor, lineHeight: 1,
          }}>
            {overallScore}
          </span>
          <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-muted)' }}> / 10</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: overallColor }}>
            {overallScore >= 7 ? 'Good' : overallScore >= 4 ? 'Needs Improvement' : 'Poor'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Overall Weighted Score</span>
        </div>
      </div>

      {/* Dimension tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {dimensions.map(dim => {
          const data = scores[dim.key];
          if (!data) return (
            <div key={dim.key} style={{
              padding: 14, borderRadius: 10,
              background: 'rgba(150,144,176,0.06)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{dim.label}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dim.weight}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>N/A</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Not applicable (no escalation)</div>
            </div>
          );

          const color = scoreColor(data.score);
          const bg = scoreBgColor(data.score);

          return (
            <div key={dim.key} style={{
              padding: 14, borderRadius: 10,
              background: bg, border: `1px solid ${color}25`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{dim.label}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dim.weight}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>
                {data.score}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                {data.evidence}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── Section C: Key Moments ──

function KeyMoments({ moments }) {
  if (!moments || moments.length === 0) {
    return (
      <div style={{
        ...cardStyle, background: 'rgba(0,208,156,0.06)', border: '1px solid rgba(0,208,156,0.2)',
        textAlign: 'center', padding: 30,
      }}>
        <div style={{ fontSize: 24, marginBottom: 8, color: '#00D09C' }}>&#10003;</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#00D09C' }}>No issues detected</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          Conversation appears to have resolved normally.
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
        <MessageCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Key Moments ({moments.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {moments.map((km, i) => (
          <KeyMomentCard key={i} moment={km} />
        ))}
      </div>
    </div>
  );
}


function KeyMomentCard({ moment }) {
  const km = moment;

  const senderStyle = (sender) => {
    if (sender === 'EndUser') return { icon: '\uD83D\uDC64', label: 'User', color: '#7B61FF', bg: 'rgba(123,97,255,0.08)' };
    if (sender === 'Chatbot' || sender === 'Bot') return { icon: '\uD83E\uDD16', label: 'Bot', color: '#9690B0', bg: 'rgba(150,144,176,0.06)' };
    if (sender === 'Agent') return { icon: '\uD83D\uDC64', label: 'Agent', color: '#14B8A6', bg: 'rgba(20,184,166,0.08)' };
    return { icon: '\u2699\uFE0F', label: 'System', color: '#9690B0', bg: 'rgba(150,144,176,0.04)' };
  };

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      border: `1px solid ${km.color}30`,
      background: 'var(--bg-primary)',
    }}>
      {/* Header bar */}
      <div style={{
        padding: '8px 14px',
        background: `${km.color}12`,
        borderBottom: `1px solid ${km.color}20`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 800, color: km.color,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {km.label}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{'\u2014'} {km.sublabel}</span>
        </div>
        <span style={{
          fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
          background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 4,
        }}>
          Turn {km.turn} of {km.totalTurns}
        </span>
      </div>

      {/* Messages */}
      <div style={{ padding: '10px 14px' }}>
        {km.messages.map((msg, j) => {
          const s = senderStyle(msg.sender);
          return (
            <div key={j} style={{
              display: 'flex', gap: 10, padding: '6px 0',
              borderBottom: j < km.messages.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 12, flexShrink: 0, width: 20, textAlign: 'center' }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}: </span>
                <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                  {(msg.text || '').length > 250 ? (msg.text || '').substring(0, 250) + '...' : msg.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Why this matters */}
      <div style={{
        padding: '8px 14px',
        background: `${km.color}08`,
        borderTop: `1px solid ${km.color}15`,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: km.color }}>WHY THIS MATTERS: </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{km.explanation}</span>
      </div>
    </div>
  );
}
