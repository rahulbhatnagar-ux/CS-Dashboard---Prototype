const express = require('express');
const router = express.Router();
const { runSOQL } = require('../services/salesforce');
const { coRatings, slaFallback, weeklyHighlights, slaSummary, plusIssueBreakdown, topIssueDescriptions, playStoreImprovements, slaTrend, actionPlans } = require('../services/mock-data');

// ── Existing endpoints (kept) ──

router.get('/weekly-volume', (req, res) => {
  const weeks = parseInt(req.query.weeks) || 4;
  const days = weeks * 7;
  const data = runSOQL(
    `SELECT Origin, DAY_ONLY(CreatedDate) d, Pluang_Plus__c, COUNT(Id) cnt FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Sub_Category__c != 'Spam' GROUP BY Origin, DAY_ONLY(CreatedDate), Pluang_Plus__c ORDER BY DAY_ONLY(CreatedDate)`
  );
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

router.get('/escalations', (req, res) => {
  const weeks = parseInt(req.query.weeks) || 4;
  const days = weeks * 7;
  const data = runSOQL(
    `SELECT DAY_ONLY(CreatedDate) d, COUNT(Id) cnt FROM Case WHERE Status = 'Escalated to L2' AND CreatedDate = LAST_N_DAYS:${days} GROUP BY DAY_ONLY(CreatedDate) ORDER BY DAY_ONLY(CreatedDate)`
  );
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

router.get('/channel-mix', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const data = runSOQL(
    `SELECT Origin, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} GROUP BY Origin ORDER BY COUNT(Id) DESC`
  );
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

router.get('/top-issues', (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const days = parseInt(req.query.days) || 30;
  const data = runSOQL(
    `SELECT Items__c, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Sub_Category__c != 'Spam' AND Items__c != 'Unclassified' AND Items__c != null GROUP BY Items__c ORDER BY COUNT(Id) DESC LIMIT ${limit}`
  );
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

router.get('/ratings', (req, res) => {
  // TODO: Replace CSAT with BigQuery query; Play Store from SF PlayStore_Review__c
  res.json({ ...coRatings, _source: 'mock', _updated: new Date().toISOString() });
});

router.get('/sla-by-channel', (req, res) => {
  try {
    const data = runSOQL(
      `SELECT Origin, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:30 AND SLA_Breached__c = true GROUP BY Origin ORDER BY COUNT(Id) DESC`
    );
    if (data.error || data.records.length === 0) {
      return res.json({ ...slaFallback, _source: 'mock-fallback', _updated: new Date().toISOString() });
    }
    res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
  } catch {
    res.json({ ...slaFallback, _source: 'mock-fallback', _updated: new Date().toISOString() });
  }
});

router.get('/sla-by-issue', (req, res) => {
  const data = runSOQL(
    `SELECT Items__c, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:30 AND SLA_Breached__c = true AND Items__c != 'Unclassified' AND Items__c != null GROUP BY Items__c ORDER BY COUNT(Id) DESC LIMIT 10`
  );
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

// ── Tier 1: New SF query endpoints ──

// 1.2 Category Breakdown
router.get('/categories', (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const data = runSOQL(
    `SELECT Ticket_Category__c, Sub_Category__c, Items__c, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Sub_Category__c != 'Spam' GROUP BY Ticket_Category__c, Sub_Category__c, Items__c ORDER BY COUNT(Id) DESC LIMIT 30`
  );
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

// 1.3 SLA & Performance — Aging data
router.get('/sla', (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const slaBreachData = runSOQL(
    `SELECT SLA_Breached__c, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} GROUP BY SLA_Breached__c`
  );
  res.json({ ...slaBreachData, _source: 'salesforce', _updated: new Date().toISOString() });
});

router.get('/aging', (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const data = runSOQL(
    `SELECT Origin, AVG(Ticket_Aging__c) avgAging, AVG(Agent_Aging__c) avgAgentAging, AVG(X1st_agent_response_time__c) avgFRT FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Status != 'Merged' GROUP BY Origin`
  );
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

// 1.4 Status Funnel
router.get('/status', (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const data = runSOQL(
    `SELECT Status, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} GROUP BY Status ORDER BY COUNT(Id) DESC`
  );
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

// 1.4 Jira-linked escalations
router.get('/jira-linked', (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const data = runSOQL(
    `SELECT JIRA_Key__c, Ticket_Category__c, Sub_Category__c, Items__c, Status, Subject FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND JIRA_Key__c != null ORDER BY CreatedDate DESC LIMIT 100`
  );
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

// 1.5 Summary KPIs (aggregated)
router.get('/summary', (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const total = runSOQL(`SELECT COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days}`);
  const breaches = runSOQL(`SELECT COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND SLA_Breached__c = true`);
  const jiraLinked = runSOQL(`SELECT COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND JIRA_Key__c != null`);
  const reopened = runSOQL(`SELECT COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Ticket_Reopen__c = true`);

  const totalCount = total?.records?.[0]?.total || 0;
  const breachCount = breaches?.records?.[0]?.total || 0;
  const jiraCount = jiraLinked?.records?.[0]?.total || 0;
  const reopenCount = reopened?.records?.[0]?.total || 0;

  res.json({
    totalTickets: totalCount,
    avgDaily: days > 0 ? Math.round(totalCount / days) : 0,
    slaBreaches: breachCount,
    slaBreachRate: totalCount > 0 ? +((breachCount / totalCount) * 100).toFixed(1) : 0,
    jiraLinked: jiraCount,
    escalationRate: totalCount > 0 ? +((jiraCount / totalCount) * 100).toFixed(1) : 0,
    reopened: reopenCount,
    reopenRate: totalCount > 0 ? +((reopenCount / totalCount) * 100).toFixed(1) : 0,
    _source: 'salesforce',
    _updated: new Date().toISOString(),
    _days: days,
  });
});

// 1.7 Volume trend (daily by origin)
router.get('/volume-trend', (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const data = runSOQL(
    `SELECT Origin, DAY_ONLY(CreatedDate) day, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} GROUP BY Origin, DAY_ONLY(CreatedDate) ORDER BY DAY_ONLY(CreatedDate)`
  );
  res.json({ ...data, _source: 'salesforce', _updated: new Date().toISOString() });
});

// ── ExCo deck endpoints (mock data, tagged) ──

router.get('/sla-summary', (req, res) => {
  res.json({ ...slaSummary, _source: 'mock', _updated: new Date().toISOString() });
});

router.get('/highlights', (req, res) => {
  res.json({ highlights: weeklyHighlights, _source: 'mock', _updated: new Date().toISOString() });
});

router.get('/plus-breakdown', (req, res) => {
  res.json({
    plusIssueBreakdown,
    topIssueDescriptions,
    playStoreImprovements,
    _source: 'mock',
    _updated: new Date().toISOString(),
  });
});

router.get('/sla-trend', (req, res) => {
  res.json({ trend: slaTrend, _source: 'mock', _updated: new Date().toISOString() });
});

router.get('/action-plans', (req, res) => {
  res.json({ plans: actionPlans, _source: 'mock', _updated: new Date().toISOString() });
});

module.exports = router;
