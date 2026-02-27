import React, { useState, useEffect, useRef, useCallback } from 'react';
import Badge from '../../components/Badge';
import {
  Search, FileText, ChevronDown, ChevronUp, CheckCircle, AlertTriangle,
  Loader, Copy, Send, Eye, Edit3, Camera, Info, Zap, ArrowRight, Hash,
  ExternalLink, User, Clock, Tag,
} from 'lucide-react';
import { fmtDate } from '../../utils/formatters';

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */

// Detect placeholder fields (image/screenshot markers)
const isPlaceholder = (key) =>
  key.endsWith('_PLACEHOLDER') && !['CORRECTED_NAME_PLACEHOLDER'].includes(key);

/* ── Simple markdown table renderer ── */
function RenderMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect markdown table: starts with | and next line is separator
    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1]?.trim().startsWith('|') && lines[i + 1].includes('---')) {
      // Gather all table lines
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!lines[i].includes('---')) tableLines.push(lines[i]);
        i++;
      }
      out.push(
        <table key={`t-${i}`} style={{
          width: '100%', borderCollapse: 'collapse', margin: '8px 0', fontSize: 12,
        }}>
          <tbody>
            {tableLines.map((row, ri) => {
              const cells = row.split('|').filter(c => c.trim() !== '');
              return (
                <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                  {cells.map((cell, ci) => {
                    const trimmed = cell.trim();
                    const isBold = trimmed.startsWith('**') && trimmed.endsWith('**');
                    const isPlaceholderCell = trimmed.includes('_PLACEHOLDER');
                    return (
                      <td key={ci} style={{
                        padding: '6px 10px',
                        fontWeight: (ci === 0 || isBold) ? 600 : 400,
                        color: isPlaceholderCell ? 'var(--text-muted)' : 'var(--text)',
                        background: isPlaceholderCell ? 'rgba(150,144,176,0.06)' : 'transparent',
                        fontSize: isPlaceholderCell ? 11 : 12,
                        fontStyle: isPlaceholderCell ? 'italic' : 'normal',
                        verticalAlign: 'top',
                      }}>
                        {isPlaceholderCell ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Camera size={11} /> Attach after creating ticket
                          </span>
                        ) : (
                          <span dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
      continue;
    }

    // Headers
    if (line.startsWith('## ')) {
      out.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 700, margin: '14px 0 6px', color: 'var(--text)' }}>{line.slice(3).replace(/\*\*/g, '')}</h3>);
      i++; continue;
    }
    if (line.startsWith('#### ') || line.startsWith('### ')) {
      const slice = line.startsWith('####') ? 5 : 4;
      out.push(<h4 key={i} style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 4px', color: 'var(--text)' }}>{line.slice(slice).replace(/\*\*/g, '')}</h4>);
      i++; continue;
    }

    // Placeholder lines
    if (line.trim().match(/^\{[A-Z_]+_PLACEHOLDER\}$/)) {
      out.push(
        <div key={i} style={{
          background: 'rgba(150,144,176,0.06)', border: '1px dashed var(--border)',
          borderRadius: 8, padding: '10px 14px', margin: '6px 0', textAlign: 'center',
          color: 'var(--text-muted)', fontSize: 11, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6,
        }}>
          <Camera size={13} /> {line.trim().replace(/[{}]/g, '').replace(/_/g, ' ').toLowerCase()} — attach after creating ticket
        </div>
      );
      i++; continue;
    }

    // Empty lines
    if (line.trim() === '') { out.push(<div key={i} style={{ height: 6 }} />); i++; continue; }

    // Horizontal rules
    if (line.trim() === '---') { out.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />); i++; continue; }

    // Regular text with bold parsing
    const boldParsed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out.push(<div key={i} style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: boldParsed }} />);
    i++;
  }

  return <div>{out}</div>;
}

/* ── Step Accordion ── */
function Step({ number, title, subtitle, completed, active, children, onToggle }) {
  const isOpen = active;
  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${isOpen ? 'var(--accent-blue)' : 'var(--border)'}`,
      borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
      opacity: completed && !isOpen ? 0.7 : 1,
    }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: completed ? 'rgba(0,208,156,0.15)' : isOpen ? 'rgba(123,97,255,0.15)' : 'var(--bg-hover)',
          color: completed ? 'var(--accent-green)' : isOpen ? 'var(--accent-blue)' : 'var(--text-muted)',
          fontSize: 12, fontWeight: 700,
        }}>
          {completed ? <CheckCircle size={14} /> : number}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
          {subtitle && !isOpen && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
        </div>
        {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </div>
      {isOpen && <div style={{ padding: 18 }}>{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN RESOLVER COMPONENT
   ═══════════════════════════════════════════════════ */

export default function ResolverPage({ board, accentColor = 'var(--accent-blue)' }) {
  // State
  const [caseNumber, setCaseNumber] = useState('');
  const [caseData, setCaseData] = useState(null);
  const [relatedCases, setRelatedCases] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [templateList, setTemplateList] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [detectedType, setDetectedType] = useState(null);
  const [classification, setClassification] = useState(null);

  const [templateBody, setTemplateBody] = useState('');
  const [templateSummary, setTemplateSummary] = useState('');
  const [editableFields, setEditableFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [assigneeName, setAssigneeName] = useState('');
  const [assigneeId, setAssigneeId] = useState(null);

  const [showRaw, setShowRaw] = useState(false);
  const [rawBody, setRawBody] = useState('');
  const [editedSummary, setEditedSummary] = useState('');

  const [activeStep, setActiveStep] = useState(1);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushResult, setPushResult] = useState(null);

  const inputRef = useRef(null);

  // Auto-focus
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Fetch template list on mount
  useEffect(() => {
    fetch(`/api/agent/resolver/templates/${board}`)
      .then(r => r.json())
      .then(d => { if (d.success) setTemplateList(d.templates); })
      .catch(() => {});
  }, [board]);

  // ── Step 1: Fetch case ──
  const fetchCase = useCallback(async () => {
    const cn = caseNumber.trim();
    if (!cn) return;
    setFetchLoading(true);
    setFetchError(null);
    setCaseData(null);
    setRelatedCases([]);
    setSelectedType(null);
    setDetectedType(null);
    setClassification(null);
    setTemplateBody('');
    setTemplateSummary('');
    setFieldValues({});
    setPushResult(null);
    setActiveStep(1);

    try {
      const res = await fetch(`/api/agent/resolver/case/${cn}`);
      const data = await res.json();
      if (!data.success) {
        setFetchError(data.error || 'Case not found');
      } else {
        setCaseData(data.case);
        setRelatedCases(data.relatedCases || []);
        // Auto-classify
        const classRes = await fetch('/api/agent/resolver/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseData: data.case, board }),
        });
        const classData = await classRes.json();
        if (classData.success) {
          setClassification(classData.classification);
          setDetectedType(classData.classification.ticketType);
          setSelectedType(classData.classification.ticketType);
          applyTemplate(classData.classification.ticketType, data.case);
        }
        setActiveStep(2);
      }
    } catch (err) {
      setFetchError('Backend not responding. Make sure the server is running on port 3001.');
    } finally {
      setFetchLoading(false);
    }
  }, [caseNumber, board]);

  // ── Apply a template ──
  const applyTemplate = async (type, cd) => {
    const cData = cd || caseData;
    if (!cData) return;

    try {
      const res = await fetch('/api/agent/resolver/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseData: cData, board, ticketType: type }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplateBody(data.template.body);
        setTemplateSummary(data.template.summary);
        setEditedSummary(data.template.summary);
        setRawBody(data.template.body);
        setEditableFields(data.template.editableFields || []);
        setAssigneeName(data.template.assigneeName);
        setAssigneeId(data.template.assigneeId);

        // Init field values with defaults
        const defaults = {};
        (data.template.editableFields || []).forEach(f => {
          defaults[f.key] = f.default || '';
        });
        setFieldValues(defaults);
      }
    } catch {}
  };

  // ── When type changes, re-apply template ──
  const changeType = (type) => {
    setSelectedType(type);
    setPushResult(null);
    applyTemplate(type);
    setActiveStep(3);
  };

  // ── Build final body with field values substituted ──
  const buildFinalBody = () => {
    let body = showRaw ? rawBody : templateBody;
    for (const [key, value] of Object.entries(fieldValues)) {
      if (value) {
        body = body.split(`{${key}}`).join(value);
      }
    }
    return body;
  };

  const buildFinalSummary = () => {
    let s = editedSummary;
    for (const [key, value] of Object.entries(fieldValues)) {
      if (value) {
        s = s.split(`{${key}}`).join(value);
      }
    }
    return s;
  };

  // ── Copy to clipboard ──
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildFinalBody());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = buildFinalBody();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // ── Push to Jira ──
  const pushToJira = async () => {
    setPushLoading(true);
    try {
      const res = await fetch('/api/agent/resolver/push-to-jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board,
          summary: buildFinalSummary(),
          description: buildFinalBody(),
          assigneeId,
          caseNumber: caseData?.CaseNumber,
          priority: classification?.priority || 'Normal',
        }),
      });
      const data = await res.json();
      setPushResult(data);
    } catch {
      setPushResult({ error: 'Failed to push to Jira. Backend may not be responding.' });
    } finally {
      setPushLoading(false);
    }
  };

  // ── Check if all required fields are filled ──
  const missingRequired = editableFields
    .filter(f => f.required && !fieldValues[f.key]?.trim())
    .map(f => f.label);

  const isCSE = board === 'CSE';

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div className="page-title">{isCSE ? 'CSE' : 'CTI'} Ticket Resolver</div>
        <Badge variant={isCSE ? 'info' : 'purple'}>{board} Board</Badge>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ═══ STEP 1: Enter Case Number ═══ */}
        <Step
          number={1}
          title="Enter Salesforce Case Number"
          subtitle={caseData ? `Case #${caseData.CaseNumber} loaded` : undefined}
          completed={!!caseData}
          active={activeStep === 1}
          onToggle={() => setActiveStep(activeStep === 1 ? 0 : 1)}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                value={caseNumber}
                onChange={e => setCaseNumber(e.target.value)}
                placeholder="e.g. 00440076"
                style={{ width: '100%', padding: '10px 14px 10px 36px' }}
                onKeyDown={e => e.key === 'Enter' && fetchCase()}
              />
            </div>
            <button className="btn-primary" onClick={fetchCase} disabled={fetchLoading} style={{ minWidth: 100 }}>
              {fetchLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Fetch'}
            </button>
          </div>
          {fetchError && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} /> {fetchError}
            </div>
          )}
        </Step>

        {/* ═══ STEP 2: Case Data + Type Detection ═══ */}
        {caseData && (
          <Step
            number={2}
            title="Case Data & Template Selection"
            subtitle={selectedType ? `Template: ${templateList.find(t => t.key === selectedType)?.label || selectedType}` : undefined}
            completed={!!selectedType}
            active={activeStep === 2}
            onToggle={() => setActiveStep(activeStep === 2 ? 0 : 2)}
          >
            {/* Case Info Card */}
            <div style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: accentColor }}>
                  #{caseData.CaseNumber}
                </span>
                <Badge variant={caseData.Status === 'Closed' ? 'success' : 'warning'}>{caseData.Status}</Badge>
                <Badge variant="info">{caseData.Origin}</Badge>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8, fontWeight: 500 }}>
                {caseData.Subject || 'No subject'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: 11 }}>
                {[
                  { icon: User, label: 'User', value: caseData.SuppliedName || '—' },
                  { icon: Hash, label: 'User ID', value: caseData.User_ID__c || '—' },
                  { icon: Tag, label: 'Category', value: `${caseData.Ticket_Category__c || '—'} > ${caseData.Sub_Category__c || '—'}` },
                  { icon: FileText, label: 'Item', value: caseData.Items__c || '—' },
                  { icon: Clock, label: 'Created', value: fmtDate(caseData.CreatedDate) },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <item.icon size={11} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>{item.label}:</span>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detected type */}
            {detectedType && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Zap size={14} style={{ color: 'var(--accent-amber)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Auto-detected:</span>
                <Badge variant="warning">{templateList.find(t => t.key === detectedType)?.label || detectedType}</Badge>
              </div>
            )}

            {/* Template type selector */}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Select Template
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {templateList.map(t => (
                <button
                  key={t.key}
                  onClick={() => changeType(t.key)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    border: selectedType === t.key ? `2px solid ${accentColor}` : '1px solid var(--border)',
                    background: selectedType === t.key ? `${accentColor}15` : 'var(--bg-hover)',
                    color: selectedType === t.key ? accentColor : 'var(--text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                  {t.key === detectedType && ' ★'}
                </button>
              ))}
            </div>

            {/* Related cases */}
            {relatedCases.length > 0 && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {relatedCases.length} related cases for this user
                </summary>
                <div style={{ marginTop: 6, maxHeight: 120, overflowY: 'auto' }}>
                  {relatedCases.map((rc, i) => (
                    <div key={i} style={{ fontSize: 11, padding: '3px 0', display: 'flex', gap: 8, color: 'var(--text-muted)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: accentColor }}>{rc.CaseNumber}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rc.Subject}</span>
                      <Badge variant={rc.Status === 'Closed' ? 'success' : 'info'}>{rc.Status}</Badge>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </Step>
        )}

        {/* ═══ STEP 3: Fill Required Fields ═══ */}
        {selectedType && editableFields.length > 0 && (
          <Step
            number={3}
            title="Fill Required Fields"
            subtitle={missingRequired.length === 0 ? 'All fields complete' : `${missingRequired.length} required field(s) remaining`}
            completed={missingRequired.length === 0}
            active={activeStep === 3}
            onToggle={() => setActiveStep(activeStep === 3 ? 0 : 3)}
          >
            {/* Auto-filled fields summary */}
            <div style={{
              padding: '8px 12px', borderRadius: 8, marginBottom: 14, fontSize: 11,
              background: 'rgba(0,208,156,0.06)', border: '1px solid rgba(0,208,156,0.15)',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-green)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} /> Auto-filled from Salesforce
              </div>
              <div style={{ color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <span>User ID: <strong>{caseData?.User_ID__c || '—'}</strong></span>
                <span>Name: <strong>{caseData?.SuppliedName || '—'}</strong></span>
                <span>Case: <strong>{caseData?.CaseNumber}</strong></span>
                <span>Origin: <strong>{caseData?.Origin}</strong></span>
              </div>
            </div>

            {/* Editable fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {editableFields.map(field => (
                <div key={field.key}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                    color: 'var(--text-muted)', marginBottom: 4,
                  }}>
                    {field.label}
                    {field.required && <span style={{ color: 'var(--accent-red)' }}>*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={fieldValues[field.key] || ''}
                      onChange={e => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      style={{
                        width: '100%', padding: '8px 12px', fontSize: 12,
                        background: 'var(--bg-primary)', border: '1px solid var(--border)',
                        borderRadius: 8, color: 'var(--text)',
                      }}
                    >
                      {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={fieldValues[field.key] || ''}
                      onChange={e => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      rows={3}
                      style={{
                        width: '100%', padding: '8px 12px', fontSize: 12,
                        background: 'var(--bg-primary)',
                        border: `1px solid ${field.required && !fieldValues[field.key]?.trim() ? 'rgba(255,176,32,0.5)' : 'var(--border)'}`,
                        borderRadius: 8, color: 'var(--text)', resize: 'vertical',
                        fontFamily: 'inherit', lineHeight: 1.6,
                      }}
                    />
                  ) : (
                    <input
                      value={fieldValues[field.key] || ''}
                      onChange={e => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      style={{
                        width: '100%', padding: '8px 12px', fontSize: 12,
                        background: 'var(--bg-primary)',
                        border: `1px solid ${field.required && !fieldValues[field.key]?.trim() ? 'rgba(255,176,32,0.5)' : 'var(--border)'}`,
                        borderRadius: 8, color: 'var(--text)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {missingRequired.length === 0 && (
              <button
                className="btn-primary"
                onClick={() => setActiveStep(4)}
                style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowRight size={14} /> Preview Ticket
              </button>
            )}
          </Step>
        )}

        {/* ═══ STEP 4: Preview & Edit ═══ */}
        {selectedType && (
          <Step
            number={editableFields.length > 0 ? 4 : 3}
            title="Preview & Edit"
            subtitle={showRaw ? 'Editing raw markdown' : 'Rendered preview'}
            completed={false}
            active={activeStep === 4 || (activeStep === 3 && editableFields.length === 0)}
            onToggle={() => setActiveStep(activeStep === 4 ? 0 : 4)}
          >
            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Ticket Title
              </label>
              <input
                value={editedSummary}
                onChange={e => setEditedSummary(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 600,
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text)',
                }}
              />
            </div>

            {/* Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                className={showRaw ? 'btn-ghost' : 'btn-secondary'}
                onClick={() => { setShowRaw(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
              >
                <Eye size={12} /> Rendered Preview
              </button>
              <button
                className={showRaw ? 'btn-secondary' : 'btn-ghost'}
                onClick={() => { setShowRaw(true); setRawBody(buildFinalBody()); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
              >
                <Edit3 size={12} /> Edit Raw Markdown
              </button>
            </div>

            {/* Preview or Raw */}
            <div style={{
              background: 'var(--bg-primary)', borderRadius: 10, padding: 16,
              border: '1px solid var(--border)', maxHeight: 500, overflowY: 'auto',
            }}>
              {showRaw ? (
                <textarea
                  value={rawBody}
                  onChange={e => setRawBody(e.target.value)}
                  style={{
                    width: '100%', minHeight: 400, padding: 0, fontSize: 12,
                    background: 'transparent', border: 'none', color: 'var(--text)',
                    fontFamily: 'var(--font-mono)', resize: 'none', lineHeight: 1.6,
                    outline: 'none',
                  }}
                />
              ) : (
                <RenderMarkdown text={buildFinalBody()} />
              )}
            </div>

            {/* Assignee info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Assignee: <strong style={{ color: 'var(--text)' }}>{assigneeName}</strong></span>
              <span>Issue Type: <strong style={{ color: 'var(--text)' }}>Sub-task</strong></span>
              <span>Board: <Badge variant={isCSE ? 'info' : 'purple'}>{board}</Badge></span>
            </div>
          </Step>
        )}

        {/* ═══ STEP 5: Push ═══ */}
        {selectedType && templateBody && (
          <Step
            number={editableFields.length > 0 ? 5 : 4}
            title="Copy or Push to Jira"
            completed={!!pushResult?.success}
            active={activeStep === 5 || (activeStep >= 4 && editableFields.length === 0)}
            onToggle={() => setActiveStep(activeStep === 5 ? 0 : 5)}
          >
            {missingRequired.length > 0 && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 12,
                background: 'rgba(255,176,32,0.08)', border: '1px solid rgba(255,176,32,0.2)',
                color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <AlertTriangle size={14} />
                Missing required fields: {missingRequired.join(', ')}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn-secondary"
                onClick={copyToClipboard}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {copySuccess ? <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
                {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                className="btn-primary"
                onClick={pushToJira}
                disabled={pushLoading || missingRequired.length > 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: isCSE ? undefined : 'var(--accent-purple)',
                }}
              >
                {pushLoading ? (
                  <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Pushing...</>
                ) : (
                  <><Send size={14} /> Push to {board} Board (Jira)</>
                )}
              </button>
            </div>

            {/* Push result */}
            {pushResult && (
              <div style={{
                marginTop: 12, padding: '12px 16px', borderRadius: 8, fontSize: 12,
                background: pushResult.error ? 'rgba(255,71,87,0.08)' : 'rgba(0,208,156,0.08)',
                border: `1px solid ${pushResult.error ? 'rgba(255,71,87,0.2)' : 'rgba(0,208,156,0.2)'}`,
                color: pushResult.error ? 'var(--accent-red)' : 'var(--accent-green)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {pushResult.error ? (
                  <><AlertTriangle size={14} /> {pushResult.error}</>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    <span>Created: <strong>{pushResult.jiraKey}</strong></span>
                    {pushResult._mock && (
                      <Badge variant="warning">Mock</Badge>
                    )}
                  </>
                )}
              </div>
            )}

            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 6, fontSize: 11,
              color: 'var(--text-muted)', background: 'var(--bg-hover)',
              display: 'flex', alignItems: 'flex-start', gap: 6,
            }}>
              <Info size={12} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>
                <strong>V1:</strong> "Push to Jira" currently generates a mock Jira key. Use "Copy to Clipboard" to paste the formatted ticket body into Jira manually.
                Nothing auto-sends — all pushes require explicit action.
              </span>
            </div>
          </Step>
        )}
      </div>
    </div>
  );
}
