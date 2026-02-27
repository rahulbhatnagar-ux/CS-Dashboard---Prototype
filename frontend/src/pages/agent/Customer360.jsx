import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChartCard from '../../components/ChartCard';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  User, Search, Phone, Mail, Calendar, Shield, Clock, FileText,
  ChevronRight, AlertTriangle, CheckCircle, Loader, Hash, Zap,
} from 'lucide-react';
import { fmtDate } from '../../utils/formatters';

/* ── Helpers ── */

// Clean up email thread descriptions — extract meaningful content
const cleanDescription = (desc) => {
  if (!desc) return '';
  // Remove image references
  let clean = desc.replace(/\[image:[^\]]*\]/g, '');
  // Remove URLs
  clean = clean.replace(/<https?:\/\/[^>]+>/g, '');
  // Remove email signatures after common markers
  const sigMarkers = ['Pada ', 'On ', '------', '> ', 'Terima Kasih,', 'Thanks,', 'Hormat saya', 'Best regards', 'Salam'];
  for (const marker of sigMarkers) {
    const idx = clean.indexOf(marker);
    // Only cut at sig markers if they appear after at least 50 chars of content
    if (idx > 50) { clean = clean.substring(0, idx).trim(); break; }
  }
  // Collapse whitespace
  clean = clean.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();
  return clean || desc.substring(0, 300);
};

const searchTypeLabel = (t) => {
  const map = { user_id: 'User ID', case_number: 'Case #', phone: 'Phone', email: 'Email', name: 'Name' };
  return map[t] || t;
};

const statusVariant = (s) => {
  if (!s) return 'info';
  const lower = s.toLowerCase();
  if (lower === 'closed') return 'success';
  if (lower.includes('escalat')) return 'error';
  if (lower === 'open' || lower === 'new') return 'warning';
  return 'info';
};

const originColor = (o) => {
  if (!o) return 'info';
  const lower = o.toLowerCase();
  if (lower.includes('email')) return 'info';
  if (lower.includes('chat')) return 'success';
  if (lower.includes('phone')) return 'purple';
  return 'info';
};

const categoryColor = (cat) => {
  const map = {
    cashout: { bg: 'rgba(255,71,87,0.12)', color: '#FF4757', label: 'Cashout' },
    topup: { bg: 'rgba(123,97,255,0.12)', color: '#7B61FF', label: 'Top-up' },
    crypto_send_receive: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa', label: 'Crypto' },
    other: { bg: 'rgba(150,144,176,0.12)', color: '#9690B0', label: 'Other' },
  };
  return map[cat] || map.other;
};

/* ── Simple Markdown renderer ── */
function RenderMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 16, fontWeight: 800, margin: '16px 0 8px', color: 'var(--text)' }}>{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, margin: '12px 0 6px', color: 'var(--text)' }}>{line.slice(4)}</h3>;
        if (line.startsWith('- **')) {
          const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
          if (match) return <div key={i} style={{ padding: '2px 0 2px 16px' }}>• <strong>{match[1]}</strong>{match[2] ? `: ${match[2]}` : ''}</div>;
        }
        if (line.startsWith('- ')) return <div key={i} style={{ padding: '2px 0 2px 16px' }}>• {line.slice(2)}</div>;
        if (line.match(/^\d+\.\s/)) {
          const parts = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          return <div key={i} style={{ padding: '2px 0 2px 16px' }} dangerouslySetInnerHTML={{ __html: parts }} />;
        }
        if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />;
        if (line.startsWith('*') && line.endsWith('*')) return <div key={i} style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: 12 }}>{line.replace(/^\*|\*$/g, '')}</div>;
        if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
        // Bold inline
        const boldParsed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return <div key={i} dangerouslySetInnerHTML={{ __html: boldParsed }} />;
      })}
    </div>
  );
}

/* ── Skeleton Loader ── */
function SkeletonLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        .skeleton-bar {
          background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border) 37%, var(--bg-hover) 63%);
          background-size: 400px 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 8px;
        }
      `}</style>
      {/* Profile skeleton */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
        <div className="skeleton-bar" style={{ width: 200, height: 20, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton-bar" style={{ width: 120, height: 14 }} />)}
        </div>
      </div>
      {/* Case list skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
              <div className="skeleton-bar" style={{ width: '60%', height: 16, marginBottom: 8 }} />
              <div className="skeleton-bar" style={{ width: '40%', height: 12 }} />
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
          <div className="skeleton-bar" style={{ width: '80%', height: 20, marginBottom: 16 }} />
          <div className="skeleton-bar" style={{ width: '100%', height: 100 }} />
        </div>
      </div>
    </div>
  );
}

/* ── Classification Breadcrumb ── */
function ClassificationBreadcrumb({ l1, l2, l3, category, source }) {
  const catStyle = categoryColor(category);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {[l1, l2, l3].filter(Boolean).map((val, i, arr) => (
          <React.Fragment key={i}>
            <span style={{
              background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: 8,
              fontSize: 12, fontWeight: 600, color: 'var(--text)',
              border: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10, marginRight: 4 }}>L{i + 1}</span>
              {val}
            </span>
            {i < arr.length - 1 && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{
          background: catStyle.bg, color: catStyle.color,
          padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
        }}>
          {catStyle.label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Source: {source === 'salesforce_existing' ? 'Salesforce' : source === 'llm' ? 'AI Classified' : source}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function Customer360() {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [classifyData, setClassifyData] = useState(null);
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [rcaData, setRcaData] = useState(null);
  const [rcaLoading, setRcaLoading] = useState(false);
  const [rcaGenerated, setRcaGenerated] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus search input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearchResult(null);
    setSelectedCaseIdx(0);
    setClassifyData(null);
    setRcaData(null);
    setRcaGenerated(false);

    try {
      const res = await fetch(`/api/agent/customer-360/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'No results found');
      } else {
        setSearchResult(data);
        // Auto-classify first case
        if (data.cases?.length > 0) {
          classifyCase(data.cases[0], 0);
        }
      }
    } catch (err) {
      setError('Backend not responding. Make sure the server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Classify a case
  const classifyCase = async (caseObj, idx) => {
    setSelectedCaseIdx(idx);
    setRcaData(null);
    setRcaGenerated(false);

    // Use inline classification from the case data (no separate API call needed for existing SF data)
    const l1 = caseObj.Ticket_Category__c || 'Unclassified';
    const l2 = caseObj.Sub_Category__c || 'N/A';
    const l3 = caseObj.Items__c || 'N/A';
    const lower = (l1 || '').toLowerCase();
    let category = 'other';
    if (lower.includes('cashout') || lower.includes('cash out')) category = 'cashout';
    else if (lower.includes('top up') || lower.includes('topup')) category = 'topup';
    else if (lower.includes('crypto')) category = 'crypto_send_receive';

    setClassifyData({
      l1, l2, l3, category,
      summary: caseObj.Description || caseObj.Subject || 'No description available',
      source: 'salesforce_existing',
    });
  };

  // Generate RCA
  const generateRCA = async () => {
    const selectedCase = searchResult?.cases?.[selectedCaseIdx];
    if (!selectedCase || !classifyData) return;

    setRcaLoading(true);
    try {
      const res = await fetch(`/api/agent/customer-360/case/${selectedCase.Id}/rca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: classifyData.category }),
      });
      const data = await res.json();
      if (data.success) {
        setRcaData(data.data);
        setRcaGenerated(true);
      }
    } catch (err) {
      setRcaData({ rcaText: '## Error\n\nFailed to generate RCA. Backend may not be responding.', source: 'error' });
    } finally {
      setRcaLoading(false);
    }
  };

  const cases = searchResult?.cases || [];
  const customer = searchResult?.customer;
  const selectedCase = cases[selectedCaseIdx];

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">Customer 360</div>
        {searchResult && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            <Badge variant="info">{searchTypeLabel(searchResult.searchType)}</Badge>
            <span>via Salesforce</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by User ID, Case Number, Phone, Email, or Name..."
            style={{ width: '100%', paddingLeft: 36, padding: '10px 14px 10px 36px' }}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
          />
        </div>
        <button className="btn-primary" onClick={doSearch} disabled={loading} style={{ minWidth: 100 }}>
          {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Search'}
        </button>
      </div>

      {/* Loading State */}
      {loading && <SkeletonLoader />}

      {/* Error State */}
      {error && (
        <div style={{
          background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)',
          borderRadius: 12, padding: 24, textAlign: 'center',
        }}>
          <AlertTriangle size={32} style={{ color: 'var(--accent-red)', marginBottom: 8 }} />
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{error}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            {error.includes('Backend') ? 'Make sure the server is running: cd backend && node server.js' : 'Try a different User ID, Case Number, Phone, Email, or Name.'}
          </div>
          <button className="btn-ghost" onClick={doSearch}>Retry</button>
        </div>
      )}

      {/* Results */}
      {searchResult && !loading && (
        <>
          {/* Customer Profile Card */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20, marginBottom: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(123,97,255,0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={20} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {customer.name !== '—' ? customer.name : `User ${customer.userId}`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  User ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{customer.userId}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { icon: Mail, label: 'Email', value: customer.email },
                { icon: Phone, label: 'Phone', value: customer.phone },
                { icon: FileText, label: 'Total Cases', value: customer.totalCases, mono: true },
                { icon: Clock, label: 'Open', value: customer.openCases, mono: true },
                { icon: CheckCircle, label: 'Closed', value: customer.closedCases, mono: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <item.icon size={13} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.label}:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: item.mono ? 'var(--font-mono)' : 'inherit' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Main: Case List + Detail Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', gap: 16, minHeight: 500 }}>
            {/* Left: Case List */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              maxHeight: 'calc(100vh - 360px)', overflowY: 'auto',
              paddingRight: 4,
            }}>
              {cases.map((c, i) => {
                const isSelected = i === selectedCaseIdx;
                return (
                  <div
                    key={c.Id || i}
                    onClick={() => classifyCase(c, i)}
                    style={{
                      background: 'var(--bg-card)',
                      border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                      borderLeft: isSelected ? '3px solid var(--accent-blue)' : '3px solid transparent',
                      borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent-blue)' }}>
                          #{c.CaseNumber}
                        </span>
                        <Badge variant={originColor(c.Origin)}>{c.Origin || '—'}</Badge>
                      </div>
                      <Badge variant={statusVariant(c.Status)}>{c.Status || '—'}</Badge>
                    </div>
                    <div style={{
                      fontSize: 12, color: 'var(--text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: '100%', marginBottom: 4,
                    }}>
                      {c.Subject || 'No subject'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(c.CreatedDate)}</span>
                      {c.Ticket_Category__c && (
                        <span style={{
                          fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-hover)',
                          padding: '2px 6px', borderRadius: 4,
                        }}>
                          {c.Ticket_Category__c}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {cases.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No cases found
                </div>
              )}
            </div>

            {/* Right: Case Detail Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
              {selectedCase ? (
                <>
                  {/* Case header */}
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: 'var(--accent-blue)' }}>
                        Case #{selectedCase.CaseNumber}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Badge variant={statusVariant(selectedCase.Status)}>{selectedCase.Status}</Badge>
                        <Badge variant={originColor(selectedCase.Origin)}>{selectedCase.Origin}</Badge>
                      </div>
                    </div>

                    {/* Classification */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                        Classification
                      </div>
                      {classifyData ? (
                        <ClassificationBreadcrumb {...classifyData} />
                      ) : classifyLoading ? (
                        <LoadingSpinner message="Classifying..." />
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No classification data</div>
                      )}
                    </div>

                    {/* Case metadata */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      {[
                        { label: 'Created', value: fmtDate(selectedCase.CreatedDate) },
                        { label: 'Closed', value: fmtDate(selectedCase.ClosedDate) },
                        { label: 'SLA', value: selectedCase.SLA_Breached__c ? 'Breached' : 'OK', variant: selectedCase.SLA_Breached__c ? 'error' : 'success' },
                        { label: 'Reopened', value: selectedCase.Ticket_Reopen__c ? 'Yes' : 'No' },
                        ...(selectedCase.JIRA_Key__c ? [{ label: 'Jira', value: selectedCase.JIRA_Key__c }] : []),
                      ].map((m, i) => (
                        <div key={i} style={{ fontSize: 11 }}>
                          <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{m.label}</div>
                          {m.variant ? <Badge variant={m.variant}>{m.value}</Badge> : (
                            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{m.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Case Summary
                      </div>
                      {selectedCase.Subject && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '60%', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedCase.Subject}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 13, lineHeight: 1.7, color: 'var(--text)',
                      background: 'var(--bg-hover)', borderRadius: 8, padding: 12,
                      maxHeight: 150, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {cleanDescription(selectedCase.Description) || selectedCase.Subject || 'No description available'}
                    </div>
                  </div>

                  {/* Conversation Placeholder */}
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 16,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                      Conversation
                    </div>
                    <div style={{
                      background: 'rgba(123,97,255,0.04)', border: '1px solid rgba(123,97,255,0.1)',
                      borderRadius: 8, padding: 16, textAlign: 'center',
                    }}>
                      <FileText size={24} style={{ color: 'var(--accent-blue)', opacity: 0.4, marginBottom: 8 }} />
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Conversation transcripts will be available once BigQuery is connected.
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, opacity: 0.6 }}>
                        Will show {selectedCase.Origin} thread for this case
                      </div>
                    </div>
                  </div>

                  {/* RCA Section */}
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Root Cause Analysis
                      </div>
                      {!rcaGenerated ? (
                        <button
                          className="btn-primary"
                          onClick={generateRCA}
                          disabled={rcaLoading}
                          style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          {rcaLoading ? (
                            <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                          ) : (
                            <><Zap size={12} /> Generate RCA</>
                          )}
                        </button>
                      ) : (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 12, color: 'var(--accent-green)', fontWeight: 600,
                        }}>
                          <CheckCircle size={14} /> RCA Generated
                        </span>
                      )}
                    </div>

                    {rcaData && (
                      <div style={{
                        background: rcaData.source === 'placeholder' ? 'rgba(150,144,176,0.05)' :
                                    rcaData.source === 'placeholder_with_sop' ? 'rgba(123,97,255,0.04)' :
                                    'var(--bg-hover)',
                        border: `1px solid ${rcaData.source === 'placeholder_with_sop' ? 'rgba(123,97,255,0.15)' : 'var(--border)'}`,
                        borderRadius: 8, padding: 16,
                      }}>
                        {rcaData.sopLoaded && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                            fontSize: 11, color: 'var(--accent-green)', fontWeight: 600,
                          }}>
                            <CheckCircle size={12} /> SOP loaded for category: {classifyData?.category}
                          </div>
                        )}
                        <RenderMarkdown text={rcaData.rcaText} />
                      </div>
                    )}

                    {!rcaData && !rcaLoading && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
                        Click "Generate RCA" to analyze this case using SOP context
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <FileText size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>Select a case to view details</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!searchResult && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>Search for a customer</div>
          <div style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
            Enter a User ID, Case Number, Phone, Email, or Name to view their full case history, classification, and root cause analysis.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            {[
              { icon: Hash, label: 'User ID', example: 'e.g. 12345' },
              { icon: FileText, label: 'Case Number', example: 'e.g. 00440076' },
              { icon: Phone, label: 'Phone', example: 'e.g. +628123456789' },
              { icon: Mail, label: 'Email', example: 'e.g. user@gmail.com' },
            ].map((hint, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 16px', textAlign: 'center', minWidth: 140,
              }}>
                <hint.icon size={16} style={{ color: 'var(--accent-blue)', marginBottom: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{hint.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint.example}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
