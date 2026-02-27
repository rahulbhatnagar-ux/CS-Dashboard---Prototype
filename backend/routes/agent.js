const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { runSOQL } = require('../services/salesforce');

const SOP_DIR = path.join(__dirname, '..', 'data', 'sops');
const { CSE_TEMPLATES, CTI_TEMPLATES, CC_LISTS, ASSIGNEES } = require('../data/jiraTemplates');

// Customer 360 — lookup by case number
router.get('/customer-by-case/:caseNumber', (req, res) => {
  const cn = req.params.caseNumber.replace(/[^0-9]/g, '');
  const data = runSOQL(
    `SELECT ContactId, Contact.Name, Contact.Email, Contact.Phone, CaseNumber, Subject, Status, Origin, CreatedDate, Ticket_Category__c, Sub_Category__c, Items__c, Pluang_Plus__c, User_ID__c FROM Case WHERE CaseNumber = '${cn}' LIMIT 1`
  );
  if (data.records && data.records.length > 0) {
    const contactId = data.records[0].ContactId;
    const pluangId = data.records[0].User_ID__c;
    // TODO: Bridge to BigQuery user_to_salesforce_crm_identifier_mappings for full user data
    const allCases = contactId
      ? runSOQL(
          `SELECT CaseNumber, Subject, Status, Origin, CreatedDate, Ticket_Category__c, Items__c, Pluang_Plus__c FROM Case WHERE ContactId = '${contactId}' ORDER BY CreatedDate DESC LIMIT 50`
        )
      : { records: [] };
    res.json({
      customer: data.records[0],
      pluangUserId: pluangId || null,
      cases: allCases.records,
    });
  } else {
    res.status(404).json({ error: 'Case not found' });
  }
});

// Customer 360 — lookup by identifier (phone, email, pluang ID)
router.get('/customer/:identifier', (req, res) => {
  const id = req.params.identifier.trim();
  let query;
  if (/^\d{5,}$/.test(id)) {
    // Looks like a case number or pluang user ID
    query = `SELECT ContactId, Contact.Name, Contact.Email, Contact.Phone, CaseNumber, Subject, Status, Origin, CreatedDate, Ticket_Category__c, Items__c, Pluang_Plus__c, User_ID__c FROM Case WHERE CaseNumber = '${id}' OR User_ID__c = '${id}' ORDER BY CreatedDate DESC LIMIT 1`;
  } else if (id.includes('@')) {
    query = `SELECT ContactId, Contact.Name, Contact.Email, Contact.Phone, CaseNumber, Subject, Status, Origin, CreatedDate, Ticket_Category__c, Items__c, Pluang_Plus__c, User_ID__c FROM Case WHERE Contact.Email = '${id}' ORDER BY CreatedDate DESC LIMIT 1`;
  } else {
    query = `SELECT ContactId, Contact.Name, Contact.Email, Contact.Phone, CaseNumber, Subject, Status, Origin, CreatedDate, Ticket_Category__c, Items__c, Pluang_Plus__c, User_ID__c FROM Case WHERE Contact.Phone LIKE '%${id}%' ORDER BY CreatedDate DESC LIMIT 1`;
  }
  const data = runSOQL(query);
  if (data.records && data.records.length > 0) {
    const contactId = data.records[0].ContactId;
    const allCases = contactId
      ? runSOQL(
          `SELECT CaseNumber, Subject, Status, Origin, CreatedDate, Ticket_Category__c, Items__c, Pluang_Plus__c FROM Case WHERE ContactId = '${contactId}' ORDER BY CreatedDate DESC LIMIT 50`
        )
      : { records: [] };
    res.json({
      customer: data.records[0],
      pluangUserId: data.records[0].User_ID__c || null,
      cases: allCases.records,
    });
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

// ═══════════════════════════════════════════════════
// CUSTOMER 360 — NEW UNIFIED ENDPOINTS
// ═══════════════════════════════════════════════════

// Detect input type for smart search
function detectSearchType(q) {
  q = q.trim();
  if (/^(\+628|628|08)\d{7,13}$/.test(q)) return 'phone';
  if (q.includes('@') && q.includes('.')) return 'email';
  if (/^00\d{5,}$/.test(q)) return 'case_number'; // 00xxxxx — 7+ digit case numbers starting with 00
  if (/^\d{8}$/.test(q)) return 'case_number'; // exactly 8-digit case number
  if (/^\d{5,10}$/.test(q)) return 'user_id';
  return 'name'; // default — try name search
}

// Map Ticket_Category__c to SOP category
function mapToCategory(ticketCategory) {
  if (!ticketCategory) return 'other';
  const lower = ticketCategory.toLowerCase();
  if (lower.includes('cashout') || lower.includes('cash out')) return 'cashout';
  if (lower.includes('top up') || lower.includes('topup')) return 'topup';
  if (lower.includes('crypto')) return 'crypto_send_receive';
  return 'other';
}

// Count scenarios in SOP
function countScenarios(sop) {
  let count = 0;
  const subCats = sop.sub_categories || sop.l3_categories || [];
  subCats.forEach(sc => { count += (sc.scenarios || []).length; });
  return count;
}

// Get SOP summary
function getSopSummary(sop) {
  const subCats = sop.sub_categories || sop.l3_categories || [];
  return subCats.map(sc => {
    const name = sc.sub_category_l2 || sc.l3_item || 'Unknown';
    const scenarios = (sc.scenarios || []).length;
    return `- **${name}**: ${scenarios} scenario${scenarios !== 1 ? 's' : ''}`;
  }).join('\n');
}

// Helper: given a seed case, find ALL cases for the same customer
// Tries: User_ID__c → SuppliedEmail → SuppliedPhone (last 8 digits)
function expandCases(seedCase, fields) {
  const userId = seedCase.User_ID__c;
  if (userId) {
    const data = runSOQL(`SELECT ${fields} FROM Case WHERE User_ID__c = '${userId}' ORDER BY CreatedDate DESC LIMIT 50`);
    if (data.records && data.records.length > 0) return data.records;
  }
  const email = seedCase.SuppliedEmail;
  if (email) {
    const data = runSOQL(`SELECT ${fields} FROM Case WHERE SuppliedEmail = '${email}' ORDER BY CreatedDate DESC LIMIT 50`);
    if (data.records && data.records.length > 0) return data.records;
  }
  const phone = seedCase.SuppliedPhone;
  if (phone) {
    const last8 = phone.replace(/^\+?62|^0/, '').replace(/\D/g, '').slice(-8);
    if (last8.length >= 6) {
      const data = runSOQL(`SELECT ${fields} FROM Case WHERE SuppliedPhone LIKE '%${last8}%' ORDER BY CreatedDate DESC LIMIT 50`);
      if (data.records && data.records.length > 0) return data.records;
    }
  }
  return null; // couldn't expand
}

// GET /api/agent/customer-360/search?q={query}
router.get('/customer-360/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ success: false, error: 'Search query is required' });

  const searchType = detectSearchType(q);
  let soql;
  const fields = 'Id, CaseNumber, Subject, Status, Origin, CreatedDate, ClosedDate, Ticket_Category__c, Sub_Category__c, Items__c, Last_Ticket_State__c, User_ID__c, SuppliedEmail, SuppliedName, SuppliedPhone, Description, SLA_Breached__c, Ticket_Aging__c, Ticket_Reopen__c, JIRA_Key__c';

  switch (searchType) {
    case 'user_id':
      soql = `SELECT ${fields} FROM Case WHERE User_ID__c = '${q}' ORDER BY CreatedDate DESC LIMIT 50`;
      break;
    case 'case_number':
      soql = `SELECT ${fields} FROM Case WHERE CaseNumber = '${q}' LIMIT 1`;
      break;
    case 'email':
      soql = `SELECT ${fields} FROM Case WHERE SuppliedEmail = '${q}' ORDER BY CreatedDate DESC LIMIT 50`;
      break;
    case 'phone': {
      const last8 = q.replace(/^\+?62|^0/, '').replace(/\D/g, '').slice(-8);
      soql = `SELECT ${fields} FROM Case WHERE SuppliedPhone LIKE '%${last8}%' ORDER BY CreatedDate DESC LIMIT 50`;
      break;
    }
    case 'name':
      soql = `SELECT ${fields} FROM Case WHERE SuppliedName LIKE '%${q}%' ORDER BY CreatedDate DESC LIMIT 50`;
      break;
    default:
      soql = `SELECT ${fields} FROM Case WHERE User_ID__c = '${q}' ORDER BY CreatedDate DESC LIMIT 50`;
  }

  try {
    let data = runSOQL(soql);
    let cases = data.records || [];

    // For case_number search, expand to all cases for the same customer
    if (searchType === 'case_number' && cases.length > 0) {
      const expanded = expandCases(cases[0], fields);
      if (expanded) cases = expanded;
    }

    if (cases.length === 0) {
      const typeLabel = { user_id: 'User ID', case_number: 'Case Number', phone: 'Phone', email: 'Email', name: 'Name' };
      return res.json({ success: false, error: `No cases found for ${typeLabel[searchType] || searchType}: ${q}` });
    }

    // Build customer profile from first case
    const first = cases[0];
    const openCases = cases.filter(c => c.Status !== 'Closed').length;

    res.json({
      success: true,
      searchType,
      customer: {
        userId: first.User_ID__c || '—',
        name: first.SuppliedName || '—',
        email: first.SuppliedEmail || '—',
        phone: first.SuppliedPhone || '—',
        totalCases: cases.length,
        openCases,
        closedCases: cases.length - openCases,
      },
      cases,
      _source: 'salesforce',
      _updated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: `Salesforce query failed: ${err.message}` });
  }
});

// GET /api/agent/customer-360/case/:caseId/conversation
router.get('/customer-360/case/:caseId/conversation', (req, res) => {
  const { caseId } = req.params;
  const origin = req.query.origin || 'Email';
  res.json({
    success: true,
    placeholder: true,
    message: 'BigQuery integration pending. Will show conversation transcripts once BQ service account is connected.',
    caseId,
    origin,
  });
});

// POST /api/agent/customer-360/case/:caseId/classify
router.post('/customer-360/case/:caseId/classify', (req, res) => {
  const { caseId } = req.params;
  try {
    const soql = `SELECT Ticket_Category__c, Sub_Category__c, Items__c, Description, Subject FROM Case WHERE Id = '${caseId}' LIMIT 1`;
    const result = runSOQL(soql);
    const record = (result.records || [])[0];
    if (!record) return res.json({ success: false, error: 'Case not found' });

    res.json({
      success: true,
      data: {
        l1: record.Ticket_Category__c || 'Unclassified',
        l2: record.Sub_Category__c || 'N/A',
        l3: record.Items__c || 'N/A',
        category: mapToCategory(record.Ticket_Category__c),
        summary: record.Description || record.Subject || 'No description',
        source: 'salesforce_existing',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agent/customer-360/case/:caseId/rca
router.post('/customer-360/case/:caseId/rca', (req, res) => {
  const { caseId } = req.params;
  const category = req.body.category || 'other';

  let sopData = null;
  try {
    if (category === 'cashout') sopData = JSON.parse(fs.readFileSync(path.join(SOP_DIR, 'cashoutSop.json'), 'utf8'));
    else if (category === 'topup') sopData = JSON.parse(fs.readFileSync(path.join(SOP_DIR, 'topupSop.json'), 'utf8'));
    else if (category === 'crypto_send_receive') sopData = JSON.parse(fs.readFileSync(path.join(SOP_DIR, 'cryptoSendReceiveSop.json'), 'utf8'));
  } catch (e) { /* SOP not found */ }

  if (!sopData) {
    return res.json({
      success: true,
      placeholder: true,
      data: {
        rcaText: `## Root Cause Analysis\n\n**Status:** Awaiting data integration\n\nFull RCA requires:\n1. ✅ Salesforce case data (available)\n2. ⏳ BigQuery Firebase events (pending BQ connection)\n3. ⏳ Admin Panel transaction history (pending API token)\n4. ❌ SOP context: Category "${category}" — No SOP available for this category\n\nOnce all data sources are connected, this will generate an AI-powered root cause analysis combining the user's event timeline, transaction history, and category-specific SOP troubleshooting steps.`,
        caseId,
        category,
        source: 'placeholder',
      },
    });
  }

  const scenarioCount = countScenarios(sopData);
  return res.json({
    success: true,
    placeholder: true,
    data: {
      rcaText: `## Root Cause Analysis — Preview\n\n**Category:** ${sopData.category_l1}\n**SOP Loaded:** ${sopData.sub_category_l2 || 'Multiple subcategories'}\n**Available Scenarios:** ${scenarioCount} troubleshooting scenarios\n\n### What This RCA Engine Will Do (once fully connected):\n1. Pull **Firebase analytics events** for this user (3 days before ticket)\n2. Pull **transaction history** from Admin Panel\n3. Match the case to one of ${scenarioCount} SOP scenarios\n4. Generate root cause analysis using AI + SOP context\n5. Provide **recommended resolution script** in Bahasa Indonesia and English\n\n### SOP Coverage:\n${getSopSummary(sopData)}\n\n---\n*Full AI-powered RCA will be available once BigQuery and Admin Panel connections are established.*`,
      caseId,
      category,
      sopLoaded: true,
      source: 'placeholder_with_sop',
    },
  });
});

// ═══════════════════════════════════════════════════
// RESOLVER ENDPOINTS
// ═══════════════════════════════════════════════════

// Classify ticket type from SF case fields
function classifyTicket(caseData) {
  const cat = (caseData.Ticket_Category__c || '').toLowerCase();
  const sub = (caseData.Sub_Category__c || '').toLowerCase();
  const items = (caseData.Items__c || '').toLowerCase();
  const subject = (caseData.Subject || '').toLowerCase();

  // CSE Types
  if (items.includes('name adjustment') || subject.includes('adjustment name') || subject.includes('adjust name'))
    return { ticketType: 'NAME_ADJUSTMENT', board: 'CSE', priority: 'Normal' };
  if (items.includes('bca') && (cat.includes('top up') || subject.includes('top up')))
    return { ticketType: 'BCA_TOPUP_VERIFY', board: 'CSE', priority: 'Normal' };
  if (cat.includes('top up') && (subject.includes('usd') || subject.includes('direct deposit')))
    return { ticketType: 'USD_TOPUP_DIRECT', board: 'CSE', priority: 'Normal' };
  if (cat.includes('top up'))
    return { ticketType: 'TOPUP_ISSUE', board: 'CSE', priority: 'Normal' };
  if (cat.includes('cashout') && (subject.includes('usd') || subject.includes('direct')))
    return { ticketType: 'USD_CASHOUT_DIRECT', board: 'CSE', priority: 'Normal' };
  if (cat.includes('cashout'))
    return { ticketType: 'CASHOUT_ISSUE', board: 'CSE', priority: 'Normal' };
  if (items.includes('authenticator') || subject.includes('authenticator'))
    return { ticketType: 'RESET_AUTHENTICATOR', board: 'CSE', priority: 'Normal' };
  if (items.includes('pin') || subject.includes('reset pin'))
    return { ticketType: 'RESET_PIN', board: 'CSE', priority: 'Normal' };
  if (subject.includes('switch rdn') || (subject.includes('rdn') && sub.includes('rdn')))
    return { ticketType: 'SWITCH_RDN', board: 'CSE', priority: 'Normal' };
  if (subject.includes('monthly statement') || subject.includes('statement'))
    return { ticketType: 'MONTHLY_STATEMENT', board: 'CTI', priority: '[P1]' };
  if (subject.includes('delete') && subject.includes('bank'))
    return { ticketType: 'DELETE_BANK', board: 'CSE', priority: 'Normal' };
  if (subject.includes('deactivat') || subject.includes('reactivat') || subject.includes('suspicious'))
    return { ticketType: 'ACCOUNT_REACTIVATION', board: 'CTI', priority: '[P0]' };

  // CTI Types
  if (cat.includes('crypto') && (subject.includes('send') || subject.includes('receive') || subject.includes('transfer')))
    return { ticketType: 'CRYPTO_TRANSFER_ISSUE', board: 'CTI', priority: '[P0]' };
  if (items.includes('edd') || subject.includes('edd') || subject.includes('verification issue'))
    return { ticketType: 'KYC_EDD_ISSUE', board: 'CTI', priority: '[P1]' };
  if (subject.includes('unable') || subject.includes('cannot') || subject.includes('error') || subject.includes('bug'))
    return { ticketType: 'BUG_REPORT', board: 'CTI', priority: '[P0]' };

  return { ticketType: 'GENERAL', board: 'CSE', priority: 'Normal' };
}

// Build CC list string
function buildCCList(ccKeys) {
  return ccKeys.map(k => CC_LISTS[k] || '').filter(Boolean).join(' ');
}

// Prefill template with case data
function prefillTemplate(template, caseData) {
  let body = template.bodyTemplate;
  const ccStr = buildCCList(template.ccList);
  const now = new Date();

  const autoMap = {
    '{USER_ID}': caseData.User_ID__c || '—',
    '{USER_NAME}': caseData.SuppliedName || '—',
    '{SF_TICKET_NUMBER}': caseData.CaseNumber || '—',
    '{CASE_ORIGIN}': caseData.Origin || '—',
    '{CC_LIST}': ccStr,
    '{JIRA_DATE}': now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  for (const [placeholder, value] of Object.entries(autoMap)) {
    body = body.split(placeholder).join(value);
  }

  // Build summary
  let summary = template.summaryPattern;
  for (const [placeholder, value] of Object.entries(autoMap)) {
    summary = summary.split(placeholder).join(value);
  }

  return { body, summary, ccString: ccStr };
}

// GET /api/agent/resolver/case/:caseNumber
router.get('/resolver/case/:caseNumber', (req, res) => {
  const cn = req.params.caseNumber.replace(/[^0-9]/g, '');
  const fields = 'Id, CaseNumber, Subject, Description, Status, Origin, CreatedDate, Ticket_Category__c, Sub_Category__c, Items__c, Last_Ticket_State__c, User_ID__c, SuppliedEmail, SuppliedName, SuppliedPhone, SLA_Breached__c, Priority';

  try {
    const result = runSOQL(`SELECT ${fields} FROM Case WHERE CaseNumber = '${cn}' LIMIT 1`);
    const record = (result.records || [])[0];
    if (!record) return res.json({ success: false, error: 'Case not found' });

    // Also fetch related cases
    let relatedCases = [];
    if (record.User_ID__c) {
      const relData = runSOQL(`SELECT CaseNumber, Subject, Status, Origin, CreatedDate FROM Case WHERE User_ID__c = '${record.User_ID__c}' AND CaseNumber != '${cn}' ORDER BY CreatedDate DESC LIMIT 10`);
      relatedCases = relData.records || [];
    } else if (record.SuppliedEmail) {
      const relData = runSOQL(`SELECT CaseNumber, Subject, Status, Origin, CreatedDate FROM Case WHERE SuppliedEmail = '${record.SuppliedEmail}' AND CaseNumber != '${cn}' ORDER BY CreatedDate DESC LIMIT 10`);
      relatedCases = relData.records || [];
    }

    res.json({
      success: true,
      case: record,
      relatedCases,
      userId: record.User_ID__c,
      userName: record.SuppliedName,
      userEmail: record.SuppliedEmail,
      userPhone: record.SuppliedPhone,
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// POST /api/agent/resolver/classify
router.post('/resolver/classify', (req, res) => {
  const { caseData, board } = req.body;
  const classification = classifyTicket(caseData);

  // Get correct template set
  const templates = board === 'CTI' ? CTI_TEMPLATES : CSE_TEMPLATES;
  // Check if the detected type exists in the requested board's templates
  let selectedType = classification.ticketType;
  if (!templates[selectedType]) selectedType = 'GENERAL';

  const template = templates[selectedType];
  const prefilled = prefillTemplate(template, caseData);
  const assigneeInfo = ASSIGNEES[template.assignee] || {};

  res.json({
    success: true,
    classification: { ...classification, ticketType: selectedType },
    template: {
      ...prefilled,
      editableFields: template.editableFields,
      assignee: template.assignee,
      assigneeName: assigneeInfo.name || template.assignee,
      assigneeId: assigneeInfo.id || null,
      issueType: template.issueType,
    },
  });
});

// GET /api/agent/resolver/templates/:board
router.get('/resolver/templates/:board', (req, res) => {
  const board = req.params.board.toUpperCase();
  const templates = board === 'CTI' ? CTI_TEMPLATES : CSE_TEMPLATES;
  const list = Object.entries(templates).map(([key, t]) => ({
    key,
    label: t.label,
    assignee: t.assignee,
    assigneeName: (ASSIGNEES[t.assignee] || {}).name || t.assignee,
    fieldCount: t.editableFields.length,
    requiredFields: t.editableFields.filter(f => f.required).length,
  }));
  res.json({ success: true, board, templates: list, assignees: ASSIGNEES });
});

// POST /api/agent/resolver/prefill
router.post('/resolver/prefill', (req, res) => {
  const { caseData, board, ticketType } = req.body;
  const templates = board === 'CTI' ? CTI_TEMPLATES : CSE_TEMPLATES;
  const template = templates[ticketType] || templates.GENERAL;
  const prefilled = prefillTemplate(template, caseData);
  const assigneeInfo = ASSIGNEES[template.assignee] || {};

  res.json({
    success: true,
    template: {
      ...prefilled,
      editableFields: template.editableFields,
      assignee: template.assignee,
      assigneeName: assigneeInfo.name || template.assignee,
      assigneeId: assigneeInfo.id || null,
      issueType: template.issueType,
      ccList: template.ccList,
    },
  });
});

// POST /api/agent/resolver/push-to-jira
router.post('/resolver/push-to-jira', (req, res) => {
  const { board, summary, description, assigneeId, parentKey, priority, caseNumber } = req.body;
  const projectKey = board;
  const issueTypeId = board === 'CSE' ? '10002' : '10801';

  // V1: Mock push — return formatted output for clipboard
  const mockKey = board === 'CSE'
    ? `CSE-${66385 + Math.floor(Math.random() * 100)}`
    : `CTI-${1353 + Math.floor(Math.random() * 50)}`;

  console.log(`[RESOLVER PUSH] Board: ${board}, Case: ${caseNumber}, Jira: ${mockKey}, Time: ${new Date().toISOString()}`);

  res.json({
    success: true,
    preview: true,
    jiraKey: mockKey,
    message: `Created Jira ${board === 'CSE' ? 'Sub-task' : 'Sub-task'} ${mockKey} for SF Case #${caseNumber}`,
    _mock: true,
    jiraPayload: {
      fields: {
        project: { key: projectKey },
        summary,
        description,
        issuetype: { id: issueTypeId },
        ...(assigneeId && { assignee: { accountId: assigneeId } }),
        ...(parentKey && { parent: { key: parentKey } }),
      },
    },
  });
});

// CSE Ticket Queue
router.get('/cse-queue', (req, res) => {
  const data = runSOQL(
    `SELECT CaseNumber, Subject, Status, Origin, CreatedDate, Ticket_Category__c, Sub_Category__c, Items__c, Description, Priority FROM Case WHERE Status = 'Escalated to L2' AND CreatedDate = LAST_N_DAYS:7 ORDER BY CreatedDate DESC LIMIT 20`
  );
  res.json(data);
});

// CSE Push to Jira
router.post('/cse-push', (req, res) => {
  const { caseNumber, summary, priority } = req.body;
  // TODO: Connect to Jira API with proper auth tokens
  // Jira Cloud ID: e390dcc1-1939-4cdf-9524-4b16401cf1df
  // Endpoint: POST /rest/api/3/issue
  // Project: CSE, Issue Type: Sub-task (10002), Priority: Normal (3)
  const mockKey = `CSE-${66385 + Math.floor(Math.random() * 100)}`;
  console.log(`[CSE PUSH] Case: ${caseNumber}, Jira: ${mockKey}, Time: ${new Date().toISOString()}`);
  res.json({
    success: true,
    jiraKey: mockKey,
    message: `Created Jira Sub-task ${mockKey} for SF Case #${caseNumber}`,
    _mock: true,
  });
});

// CTI Ticket Queue
router.get('/cti-queue', (req, res) => {
  const data = runSOQL(
    `SELECT CaseNumber, Subject, Status, Origin, CreatedDate, Ticket_Category__c, Sub_Category__c, Items__c, Description, Priority FROM Case WHERE Ticket_Category__c IN ('Application', 'Asset Crypto', 'Asset US Stocks', 'Indonesian Stocks', 'Asset Crypto Futures') AND Status IN ('Escalated to L2', 'Open') AND CreatedDate = LAST_N_DAYS:7 ORDER BY CreatedDate DESC LIMIT 20`
  );
  res.json(data);
});

// CTI Push to Jira
router.post('/cti-push', (req, res) => {
  const { caseNumber, summary, priority } = req.body;
  // TODO: Connect to Jira API with proper auth tokens
  // Jira Cloud ID: e390dcc1-1939-4cdf-9524-4b16401cf1df
  // Endpoint: POST /rest/api/3/issue
  // Project: CTI, Issue Type: Task (10800), Priority: Normal (3)
  const mockKey = `CTI-${1353 + Math.floor(Math.random() * 50)}`;
  console.log(`[CTI PUSH] Case: ${caseNumber}, Jira: ${mockKey}, Time: ${new Date().toISOString()}`);
  res.json({
    success: true,
    jiraKey: mockKey,
    message: `Created Jira Task ${mockKey} for SF Case #${caseNumber}`,
    _mock: true,
  });
});

module.exports = router;
