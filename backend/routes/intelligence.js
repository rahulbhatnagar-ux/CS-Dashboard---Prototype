const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { runSOQL } = require('../services/salesforce');
const { analyzeTranscript } = require('../services/transcript-analyzer');
const mock = require('../services/mock-data');

const DATA_DIR = path.join(__dirname, '../data');

function loadDataFile(name) {
  const filepath = path.join(DATA_DIR, `${name}.json`);
  if (fs.existsSync(filepath)) {
    try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); }
    catch (err) { return { error: `Failed to read ${name}.json: ${err.message}` }; }
  }
  return null;
}

// ── CSAT Analysis ──
router.get('/csat', (req, res) => {
  // CSAT from BQ/Survey — mock for now with source tag
  res.json({ ...mock.csatData, _source: 'mock', _reason: 'CSAT requires BQ Survey integration', _updated: new Date().toISOString() });
});

// ── Channel Mix & FCR ──
router.get('/channel-shift', (req, res) => {
  res.json({ shift: mock.channelShift, metrics: mock.channelMixMetrics, _source: 'mock', _updated: new Date().toISOString() });
});

// ── Product Feedback ──
router.get('/product-feedback', (req, res) => {
  res.json({ ...mock.productFeedback, _source: 'mock', _updated: new Date().toISOString() });
});

// ── Chatbot Deep Dive — Tier 2: processed Excel data ──
router.get('/chatbot-analysis', (req, res) => {
  // Try deep analysis first, fall back to basic metrics
  const deep = loadDataFile('chatbot-deep');
  if (deep && !deep.error) {
    res.json({ ...deep, _source: 'excel', _updated: new Date().toISOString() });
    return;
  }
  const data = loadDataFile('chatbot-metrics');
  if (data && !data.error) {
    res.json({
      totalSessions: data.totalSessions,
      containmentRate: +(100 - data.escalationRate).toFixed(1),
      failurePhraseRate: data.failurePhraseRate,
      avgTurnsBeforeEscalation: data.avgTurnsPerSession,
      botToAgentRate: data.botToAgentRate,
      intents: data.intentDistribution.map(i => ({ name: i.name, value: i.count })),
      outcomes: { botOnly: data.totalSessions - data.sessionsWithEscalation, botAgent: data.sessionsWithEscalation, agentOnly: 0 },
      failurePhrases: data.failurePhrases,
      _source: 'excel', _sourceFile: data._source, _processedAt: data._processedAt, _updated: new Date().toISOString(),
    });
  } else {
    res.json({ ...mock.chatbotAnalysis, _source: 'mock', _reason: data?.error || 'Run process-chatbot-deep.js', _updated: new Date().toISOString() });
  }
});

// ── Chatbot Sessions (paginated) ──
let _sessionsCache = null;
function loadSessions() {
  if (_sessionsCache) return _sessionsCache;
  const data = loadDataFile('chatbot-sessions');
  if (data && !data.error) { _sessionsCache = data; return data; }
  return null;
}

router.get('/chatbot-sessions', (req, res) => {
  const sessions = loadSessions();
  if (!sessions) {
    res.status(404).json({ error: 'Run process-chatbot-deep.js first' });
    return;
  }

  // Filter params
  const intent = req.query.intent;
  const minScore = parseFloat(req.query.minScore) || 0;
  const maxScore = parseFloat(req.query.maxScore) || 10;
  const hasFailure = req.query.hasFailure;
  const hasDeadEnd = req.query.hasDeadEnd;
  const hasFrustration = req.query.hasFrustration;
  const hasLoop = req.query.hasLoop;
  const hasEscalation = req.query.hasEscalation;
  const sortBy = req.query.sortBy || 'score';
  const sortDir = req.query.sortDir || 'asc';
  const page = parseInt(req.query.page) || 0;
  const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 200);

  let filtered = sessions.filter(s => {
    if (intent && s.primaryIntent !== intent) return false;
    if (s.score < minScore || s.score > maxScore) return false;
    if (hasFailure === 'true' && !s.hasFailure) return false;
    if (hasDeadEnd === 'true' && !s.hasDeadEnd) return false;
    if (hasFrustration === 'true' && !s.hasFrustration) return false;
    if (hasLoop === 'true' && !s.hasLoop) return false;
    if (hasEscalation === 'true' && !s.hasEscalation) return false;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const totalFiltered = filtered.length;
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  res.json({
    sessions: paginated,
    total: totalFiltered,
    page,
    pageSize,
    totalPages: Math.ceil(totalFiltered / pageSize),
    _source: 'excel',
    _updated: new Date().toISOString(),
  });
});

// ── Chatbot Transcript Detail ──
let _transcriptsCache = null;
function loadTranscripts() {
  if (_transcriptsCache) return _transcriptsCache;
  const filepath = path.join(DATA_DIR, 'chatbot-transcripts.json');
  if (fs.existsSync(filepath)) {
    try {
      _transcriptsCache = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return _transcriptsCache;
    } catch { return null; }
  }
  return null;
}

router.get('/chatbot-transcript/:sessionId', (req, res) => {
  const transcripts = loadTranscripts();
  if (!transcripts) {
    res.status(404).json({ error: 'Run process-chatbot-deep.js first' });
    return;
  }
  const messages = transcripts[req.params.sessionId];
  if (!messages) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({
    sessionId: req.params.sessionId,
    messages: messages.map(m => ({
      sender: m.s === 'b' ? 'assistant' : 'user',
      content: m.c,
      timestamp: m.t,
    })),
    _source: 'excel',
    _updated: new Date().toISOString(),
  });
});

// Legacy transcript lookup (redirect to new endpoint)
router.get('/transcript/:caseNumber', (req, res) => {
  res.json({ ...mock.mockTranscript, caseNumber: req.params.caseNumber, _source: 'mock', _reason: 'Use /chatbot/transcript instead', _updated: new Date().toISOString() });
});

// ══════════════════════════════════════════════
// LIVE SF TRANSCRIPT LOOKUP
// GET /api/intelligence/chatbot/transcript?type=case&id=00551492
// GET /api/intelligence/chatbot/transcript?type=session&id=0MwMg00000IxP02
// GET /api/intelligence/chatbot/transcript?type=sid&id=<encrypted-sid>
// ══════════════════════════════════════════════

router.get('/chatbot/transcript', (req, res) => {
  const { type, id } = req.query;
  if (!type || !id) {
    return res.status(400).json({ error: 'Missing required params: type and id' });
  }
  if (!['case', 'session', 'sid'].includes(type)) {
    return res.status(400).json({ error: 'type must be one of: case, session, sid' });
  }

  try {
    let sessionData = null;
    let caseNumber = null;
    let caseId = null;

    // Step 1: Resolve to a MessagingSession and/or Case
    if (type === 'case') {
      // Clean case number
      const cn = id.replace(/[^0-9]/g, '');
      caseNumber = cn;

      // Get Case ID first
      const caseResult = runSOQL(
        `SELECT Id, CaseNumber, Origin FROM Case WHERE CaseNumber = '${cn}'`
      );
      if (!caseResult.records || caseResult.records.length === 0) {
        return res.status(404).json({ error: `Case ${cn} not found` });
      }
      caseId = caseResult.records[0].Id;
      caseNumber = caseResult.records[0].CaseNumber;
      const caseOrigin = caseResult.records[0].Origin;

      // Try to get MessagingSession for this Case
      const msResult = runSOQL(
        `SELECT Id, ConversationId, SessionKey, SID__c, StartTime, EndTime, Status, AgentType FROM MessagingSession WHERE CaseId = '${caseId}' ORDER BY StartTime DESC LIMIT 1`
      );
      if (msResult.records && msResult.records.length > 0) {
        sessionData = msResult.records[0];
      }

    } else if (type === 'session') {
      // Direct MessagingSession lookup
      const msResult = runSOQL(
        `SELECT Id, ConversationId, CaseId, SessionKey, SID__c, StartTime, EndTime, Status, AgentType FROM MessagingSession WHERE Id = '${id}'`
      );
      if (!msResult.records || msResult.records.length === 0) {
        return res.status(404).json({ error: `MessagingSession ${id} not found` });
      }
      sessionData = msResult.records[0];
      caseId = sessionData.CaseId;

      // Get CaseNumber if linked
      if (caseId) {
        const caseResult = runSOQL(`SELECT CaseNumber FROM Case WHERE Id = '${caseId}'`);
        if (caseResult.records && caseResult.records.length > 0) {
          caseNumber = caseResult.records[0].CaseNumber;
        }
      }

    } else if (type === 'sid') {
      // Lookup by SID (encrypted session key) or SessionKey (UUID)
      // Try SessionKey first (UUID format), then SID__c
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let msResult;

      if (isUUID) {
        msResult = runSOQL(
          `SELECT Id, ConversationId, CaseId, SessionKey, SID__c, StartTime, EndTime, Status, AgentType FROM MessagingSession WHERE SessionKey = '${id}'`
        );
      } else {
        // SID__c contains encrypted values — need exact match
        const escapedSid = id.replace(/'/g, "\\'");
        msResult = runSOQL(
          `SELECT Id, ConversationId, CaseId, SessionKey, SID__c, StartTime, EndTime, Status, AgentType FROM MessagingSession WHERE SID__c = '${escapedSid}'`
        );
      }

      if (!msResult.records || msResult.records.length === 0) {
        return res.status(404).json({ error: `No MessagingSession found for SID/SessionKey: ${id.substring(0, 20)}...` });
      }
      sessionData = msResult.records[0];
      caseId = sessionData.CaseId;

      if (caseId) {
        const caseResult = runSOQL(`SELECT CaseNumber FROM Case WHERE Id = '${caseId}'`);
        if (caseResult.records && caseResult.records.length > 0) {
          caseNumber = caseResult.records[0].CaseNumber;
        }
      }
    }

    // Step 2: Try to get messages from Live_Chat_Message__c (legacy system — has actual text)
    let messages = [];
    let messageSource = null;

    if (caseId) {
      const lcmResult = runSOQL(
        `SELECT Id, Live_Chat_Message__c, Source__c, Created_At__c FROM Live_Chat_Message__c WHERE Ticket_Number__c = '${caseId}' ORDER BY Created_At__c ASC`
      );
      if (lcmResult.records && lcmResult.records.length > 0) {
        messageSource = 'Live_Chat_Message__c';
        messages = lcmResult.records.map(r => ({
          id: r.Id,
          sender: r.Source__c === 'Customer' ? 'EndUser' : r.Source__c === 'Bot' ? 'Chatbot' : 'Agent',
          senderName: r.Source__c === 'Customer' ? 'Customer' : r.Source__c === 'Bot' ? 'Bot' : 'Agent',
          text: r.Live_Chat_Message__c || '',
          timestamp: r.Created_At__c,
          messageType: 'StaticContentMessage',
        }));
      }
    }

    // Step 3: If no Live_Chat_Message__c, try ConversationEntry (new system — metadata only)
    if (messages.length === 0 && sessionData && sessionData.ConversationId) {
      const ceResult = runSOQL(
        `SELECT Id, ActorType, ActorName, EntryType, Seq, EntryTime, Message FROM ConversationEntry WHERE ConversationId = '${sessionData.ConversationId}' ORDER BY Seq ASC`
      );
      if (ceResult.records && ceResult.records.length > 0) {
        messageSource = 'ConversationEntry';
        messages = ceResult.records
          .filter(r => r.EntryType === 'Text')
          .map(r => ({
            id: r.Id,
            sender: r.ActorType || 'System',
            senderName: r.ActorType === 'EndUser' ? 'Customer' : r.ActorType === 'Bot' ? 'Bot' : r.ActorType === 'Agent' ? 'Agent' : 'System',
            text: r.Message || '[Message content not available via SOQL — content is encrypted in Salesforce Messaging]',
            timestamp: r.EntryTime,
            messageType: 'StaticContentMessage',
            seq: r.Seq,
          }));
      }
    }

    // Build session metadata
    const session = {
      id: sessionData?.Id || null,
      caseNumber: caseNumber,
      caseId: caseId,
      sessionKey: sessionData?.SessionKey || null,
      sid: sessionData?.SID__c || null,
      startTime: sessionData?.StartTime || null,
      endTime: sessionData?.EndTime || null,
      agentType: sessionData?.AgentType || 'Unknown',
      status: sessionData?.Status || 'Unknown',
      conversationId: sessionData?.ConversationId || null,
    };

    // Compute duration
    if (session.startTime && session.endTime) {
      const dur = new Date(session.endTime) - new Date(session.startTime);
      session.durationMinutes = Math.round(dur / 60000);
    }

    // Determine if escalated
    session.wasEscalated = session.agentType === 'BotToAgent' || session.agentType === 'Agent';
    session.totalMessages = messages.length;

    const response = {
      session,
      messages,
      _source: 'salesforce',
      _messageSource: messageSource || 'none',
      _note: messageSource === 'ConversationEntry'
        ? 'ConversationEntry.Message field is encrypted and not accessible via SOQL. Only metadata (who spoke, when, sequence) is available. For full message text, use the Salesforce Messaging REST API.'
        : messageSource === 'Live_Chat_Message__c'
        ? 'Messages from legacy Live Chat system (Live_Chat_Message__c). This system stopped populating after Dec 31, 2025.'
        : messages.length === 0
        ? 'No message records found for this case/session. The case may not have chat messages, or messages may be in a system not accessible via SOQL.'
        : null,
      _updated: new Date().toISOString(),
    };

    res.json(response);

  } catch (err) {
    console.error('Transcript lookup error:', err.message);
    res.status(500).json({
      error: `Transcript lookup failed: ${err.message}`,
      _updated: new Date().toISOString(),
    });
  }
});

// ══════════════════════════════════════════════
// TRANSCRIPT ANALYSIS (scoring + key moments)
// GET /api/intelligence/chatbot/analyze?type=case&id=00551492
// ══════════════════════════════════════════════

router.get('/chatbot/analyze', (req, res) => {
  const { type, id } = req.query;
  if (!type || !id) {
    return res.status(400).json({ error: 'Missing required params: type and id' });
  }
  if (!['case', 'session', 'sid'].includes(type)) {
    return res.status(400).json({ error: 'type must be one of: case, session, sid' });
  }

  try {
    let sessionData = null;
    let caseNumber = null;
    let caseId = null;

    // Step 1: Resolve to a MessagingSession and/or Case
    if (type === 'case') {
      const cn = id.replace(/[^0-9]/g, '');
      caseNumber = cn;

      const caseResult = runSOQL(
        `SELECT Id, CaseNumber, Origin FROM Case WHERE CaseNumber = '${cn}'`
      );
      if (!caseResult.records || caseResult.records.length === 0) {
        return res.status(404).json({ error: `Case ${cn} not found` });
      }
      caseId = caseResult.records[0].Id;
      caseNumber = caseResult.records[0].CaseNumber;

      const msResult = runSOQL(
        `SELECT Id, ConversationId, SessionKey, SID__c, StartTime, EndTime, Status, AgentType FROM MessagingSession WHERE CaseId = '${caseId}' ORDER BY StartTime DESC LIMIT 1`
      );
      if (msResult.records && msResult.records.length > 0) {
        sessionData = msResult.records[0];
      }

    } else if (type === 'session') {
      const msResult = runSOQL(
        `SELECT Id, ConversationId, CaseId, SessionKey, SID__c, StartTime, EndTime, Status, AgentType FROM MessagingSession WHERE Id = '${id}'`
      );
      if (!msResult.records || msResult.records.length === 0) {
        return res.status(404).json({ error: `MessagingSession ${id} not found` });
      }
      sessionData = msResult.records[0];
      caseId = sessionData.CaseId;

      if (caseId) {
        const caseResult = runSOQL(`SELECT CaseNumber FROM Case WHERE Id = '${caseId}'`);
        if (caseResult.records && caseResult.records.length > 0) {
          caseNumber = caseResult.records[0].CaseNumber;
        }
      }

    } else if (type === 'sid') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let msResult;

      if (isUUID) {
        msResult = runSOQL(
          `SELECT Id, ConversationId, CaseId, SessionKey, SID__c, StartTime, EndTime, Status, AgentType FROM MessagingSession WHERE SessionKey = '${id}'`
        );
      } else {
        const escapedSid = id.replace(/'/g, "\\'");
        msResult = runSOQL(
          `SELECT Id, ConversationId, CaseId, SessionKey, SID__c, StartTime, EndTime, Status, AgentType FROM MessagingSession WHERE SID__c = '${escapedSid}'`
        );
      }

      if (!msResult.records || msResult.records.length === 0) {
        return res.status(404).json({ error: `No MessagingSession found for SID/SessionKey: ${id.substring(0, 20)}...` });
      }
      sessionData = msResult.records[0];
      caseId = sessionData.CaseId;

      if (caseId) {
        const caseResult = runSOQL(`SELECT CaseNumber FROM Case WHERE Id = '${caseId}'`);
        if (caseResult.records && caseResult.records.length > 0) {
          caseNumber = caseResult.records[0].CaseNumber;
        }
      }
    }

    // Step 2: Get messages — prefer Live_Chat_Message__c (has text)
    let messages = [];
    let messageSource = null;

    if (caseId) {
      const lcmResult = runSOQL(
        `SELECT Id, Live_Chat_Message__c, Source__c, Created_At__c FROM Live_Chat_Message__c WHERE Ticket_Number__c = '${caseId}' ORDER BY Created_At__c ASC`
      );
      if (lcmResult.records && lcmResult.records.length > 0) {
        messageSource = 'Live_Chat_Message__c';
        messages = lcmResult.records.map(r => ({
          sender: r.Source__c === 'Customer' ? 'EndUser' : r.Source__c === 'Bot' ? 'Chatbot' : 'Agent',
          senderName: r.Source__c === 'Customer' ? 'Customer' : r.Source__c === 'Bot' ? 'Bot' : 'Agent',
          text: r.Live_Chat_Message__c || '',
          timestamp: r.Created_At__c,
        }));
      }
    }

    // Fallback: ConversationEntry
    if (messages.length === 0 && sessionData && sessionData.ConversationId) {
      const ceResult = runSOQL(
        `SELECT Id, ActorType, ActorName, EntryType, Seq, EntryTime, Message FROM ConversationEntry WHERE ConversationId = '${sessionData.ConversationId}' ORDER BY Seq ASC`
      );
      if (ceResult.records && ceResult.records.length > 0) {
        messageSource = 'ConversationEntry';
        messages = ceResult.records
          .filter(r => r.EntryType === 'Text')
          .map(r => ({
            sender: r.ActorType || 'System',
            senderName: r.ActorType === 'EndUser' ? 'Customer' : r.ActorType === 'Bot' ? 'Bot' : r.ActorType === 'Agent' ? 'Agent' : 'System',
            text: r.Message || '',
            timestamp: r.EntryTime,
          }));
      }
    }

    // Check if we have readable text
    const hasReadableText = messages.length > 0 &&
      messages.some(m => m.text && !m.text.startsWith('[Message content not available'));

    if (!hasReadableText) {
      return res.status(422).json({
        error: 'Session has no readable messages — message content may be encrypted (post-Dec 2025 Salesforce Messaging). Analysis requires readable transcript text.',
        session: {
          id: sessionData?.Id || null,
          caseNumber,
          startTime: sessionData?.StartTime || null,
          endTime: sessionData?.EndTime || null,
          agentType: sessionData?.AgentType || 'Unknown',
          status: sessionData?.Status || 'Unknown',
          totalMessages: messages.length,
        },
        _messageSource: messageSource || 'none',
      });
    }

    // Step 3: Run analysis
    const sessionMeta = {
      startTime: sessionData?.StartTime || null,
      endTime: sessionData?.EndTime || null,
      agentType: sessionData?.AgentType || 'Unknown',
      status: sessionData?.Status || 'Unknown',
    };

    const analysis = analyzeTranscript(messages, sessionMeta);

    // Build session info
    const session = {
      id: sessionData?.Id || null,
      caseNumber: caseNumber || 'No case linked',
      startTime: sessionData?.StartTime || null,
      endTime: sessionData?.EndTime || null,
      duration: analysis.summary.duration,
      activeDuration: analysis.summary.activeDuration,
      sessionWindow: analysis.summary.sessionWindow,
      agentType: analysis.summary.agentType,
      status: sessionData?.Status || 'Unknown',
      totalTurns: analysis.summary.totalTurns,
      userTurns: analysis.summary.userTurns,
      botTurns: analysis.summary.botTurns,
      agentTurns: analysis.summary.agentTurns,
      outcome: analysis.summary.outcome,
      sessionKey: sessionData?.SessionKey || null,
    };

    // Format date nicely
    if (session.startTime) {
      try {
        session.dateFormatted = new Date(session.startTime).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
      } catch { session.dateFormatted = session.startTime; }
    }

    res.json({
      session,
      scores: analysis.scores,
      keyMoments: analysis.keyMoments,
      _source: 'salesforce',
      _messageSource: messageSource,
      _updated: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Transcript analysis error:', err.message);
    res.status(500).json({
      error: `Analysis failed: ${err.message}`,
      _updated: new Date().toISOString(),
    });
  }
});

// ── Email Deep Dive — Tier 1: SF-backed ──
router.get('/email-analysis', (req, res) => {
  const data = runSOQL(
    `SELECT Items__c, COUNT(Id) total FROM Case WHERE (Origin = 'EmailCase' OR Origin = 'Email') AND CreatedDate = LAST_N_DAYS:30 AND Items__c != null GROUP BY Items__c ORDER BY COUNT(Id) DESC LIMIT 15`
  );
  const volume = runSOQL(
    `SELECT Origin, COUNT(Id) total FROM Case WHERE (Origin = 'EmailCase' OR Origin = 'Email') AND CreatedDate = LAST_N_DAYS:30 GROUP BY Origin`
  );
  res.json({ categories: data, volume, _source: 'salesforce', _updated: new Date().toISOString() });
});

// Email Thread Lookup — try SF EmailMessage first
router.get('/email-thread/:caseNumber', (req, res) => {
  const cn = req.params.caseNumber.replace(/[^0-9]/g, '');
  try {
    const data = runSOQL(
      `SELECT Id, Subject, TextBody, FromAddress, ToAddress, MessageDate, Incoming FROM EmailMessage WHERE ParentId IN (SELECT Id FROM Case WHERE CaseNumber = '${cn}') ORDER BY MessageDate ASC`
    );
    if (data.records && data.records.length > 0) {
      res.json({
        caseNumber: cn,
        emails: data.records.map(r => ({ from: r.FromAddress, to: r.ToAddress, date: r.MessageDate, subject: r.Subject, body: r.TextBody, incoming: r.Incoming })),
        _source: 'salesforce', _updated: new Date().toISOString(),
      });
    } else {
      res.json({ ...mock.mockEmailThread, caseNumber: cn, _source: 'mock', _reason: 'No EmailMessage records found', _updated: new Date().toISOString() });
    }
  } catch {
    res.json({ ...mock.mockEmailThread, caseNumber: cn, _source: 'mock', _reason: 'EmailMessage query failed', _updated: new Date().toISOString() });
  }
});

// ── Search Utterances — Tier 2: processed Excel data ──
router.get('/search-stats', (req, res) => {
  const data = loadDataFile('search-metrics');
  if (data && !data.error) {
    res.json({
      totalSearches: data.totalSearches,
      zeroResultRate: data.zeroResultRate,
      channels: data.channelBreakdown,
      ragQueries: data.ragSearches,
      topSearchTerms: data.topSearchTerms.slice(0, 20).map(t => ({ term: t.term, count: t.count, hasArticle: t.clickRate > 0, clickRate: t.clickRate, termEN: t.termEN })),
      piiSearches: data.piiSearches,
      ragFeedback: data.ragFeedback,
      _source: 'excel', _sourceFile: data._source, _processedAt: data._processedAt, _updated: new Date().toISOString(),
    });
  } else {
    res.json({ ...mock.searchStats, _source: 'mock', _reason: data?.error || 'Run process-excel-data.js', _updated: new Date().toISOString() });
  }
});

// ── HC Deflection — Tier 2: processed Excel data ──
router.get('/hc-deflection', (req, res) => {
  const data = loadDataFile('deflection-metrics');
  if (data && !data.error) {
    res.json({
      hcVisits: { app: data.hcEntryPoints?.App || 0, web: data.hcEntryPoints?.Web || 0, uniqueUsers: data.hcUniqueVisitors },
      containmentRate: data.containmentRate,
      identityMatch: data.identityStitchRate,
      deflectionRate: data.deflectionRate,
      channelCascade: data.channelCascade,
      sfTickets: data.sfTickets,
      bqRecords: data.bqRecords,
      topArticles: mock.hcDeflection.topArticles,
      scoreDistribution: mock.hcDeflection.scoreDistribution,
      totalArticles: mock.hcDeflection.totalArticles,
      scoredArticles: mock.hcDeflection.scoredArticles,
      avgScore: mock.hcDeflection.avgScore,
      _source: 'excel+mock', _sourceFile: data._source, _processedAt: data._processedAt, _updated: new Date().toISOString(),
    });
  } else {
    res.json({ ...mock.hcDeflection, _source: 'mock', _reason: data?.error || 'Run process-excel-data.js', _updated: new Date().toISOString() });
  }
});

// ── Escalation Analysis — Tier 1: SF-backed ──
router.get('/escalation-stats', (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const byStatus = runSOQL(`SELECT Status, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} GROUP BY Status ORDER BY COUNT(Id) DESC`);
  res.json({ ...byStatus, _source: 'salesforce', _updated: new Date().toISOString() });
});

router.get('/escalation-by-category', (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const data = runSOQL(`SELECT Ticket_Category__c, COUNT(Id) total FROM Case WHERE Status = 'Escalated to L2' AND CreatedDate = LAST_N_DAYS:${days} GROUP BY Ticket_Category__c ORDER BY COUNT(Id) DESC LIMIT 10`);
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

// ── Assessment Summary — Tier 2: processed data ──
router.get('/assessment-summary', (req, res) => {
  const data = loadDataFile('assessment-summary');
  if (data && !data.error) {
    res.json({ ...data, _source: 'excel', _updated: new Date().toISOString() });
  } else {
    res.status(404).json({ error: 'Run process-excel-data.js', _updated: new Date().toISOString() });
  }
});

// ── KB Metrics — Tier 2: processed data ──
router.get('/kb-metrics', (req, res) => {
  const data = loadDataFile('kb-metrics');
  if (data && !data.error) {
    res.json({ ...data, _source: 'excel', _updated: new Date().toISOString() });
  } else {
    res.status(404).json({ error: 'Run process-excel-data.js', _updated: new Date().toISOString() });
  }
});

module.exports = router;
