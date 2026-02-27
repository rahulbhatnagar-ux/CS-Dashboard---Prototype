const express = require('express');
const router = express.Router();
const { runSOQL } = require('../services/salesforce');
const cache = require('../utils/cache');

const SLA_CACHE_TTL = 5 * 60 * 1000; // 5 min
const MONTHLY_CACHE_TTL = 15 * 60 * 1000; // 15 min

const CHANNELS = "('Email', 'EmailCase', 'Live Chat', 'In-App', 'Phone', 'L1 Agent')";
const SPAM_MERGED_FILTER = "Sub_Category__c != 'Spam' AND Status != 'Merged'";

/* ── helpers ── */

function fmt(v) { return v !== null && v !== undefined ? v : 0; }

function monthLabel(year, month) {
  const d = new Date(year, month - 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function buildMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00Z`;
  return { start, end };
}

function buildPriorMonthRange(year, month) {
  const priorMonth = month === 1 ? 12 : month - 1;
  const priorYear = month === 1 ? year - 1 : year;
  return buildMonthRange(priorYear, priorMonth);
}

/* ─────────────────────────────────────────────────────────
   SECTION 2: KPI Summary
   GET /api/sla/summary?days=90
   ───────────────────────────────────────────────────────── */
router.get('/summary', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;

    // Q1: SLA breach rate
    const breachData = runSOQL(
      `SELECT SLA_Breached__c, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND ${SPAM_MERGED_FILTER} GROUP BY SLA_Breached__c`
    );
    const breachMap = {};
    (breachData.records || []).forEach(r => { breachMap[String(r.SLA_Breached__c)] = r.total; });
    const metCount = fmt(breachMap['false']);
    const breachedCount = fmt(breachMap['true']);
    const totalSLA = metCount + breachedCount;
    const slaAchievement = totalSLA > 0 ? +((metCount / totalSLA) * 100).toFixed(1) : 0;

    // Q2: FRT stats (agent-handled, valid range)
    const frtData = runSOQL(
      `SELECT AVG(X1st_agent_response_time__c) avgFRT, COUNT(Id) frtCount FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND X1st_agent_response_time__c > 0 AND X1st_agent_response_time__c < 14400 AND ${SPAM_MERGED_FILTER}`
    );
    const frtRec = frtData.records?.[0] || {};
    const avgFRTMinutes = fmt(frtRec.avgFRT);
    const frtCount = fmt(frtRec.frtCount);

    // Q3: Ticket aging (closed cases)
    const agingData = runSOQL(
      `SELECT AVG(Ticket_Aging__c) avgAging, COUNT(Id) agingCount FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Ticket_Aging__c > 0 AND Status IN ('Closed', 'Resolved') AND Sub_Category__c != 'Spam'`
    );
    const agingRec = agingData.records?.[0] || {};
    const avgAgingMinutes = fmt(agingRec.avgAging);
    const agingCount = fmt(agingRec.agingCount);

    // Q4: Agent aging
    const agentAgingData = runSOQL(
      `SELECT AVG(Agent_Aging__c) avgAgentAging, COUNT(Id) agentAgingCount FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Agent_Aging__c > 0 AND ${SPAM_MERGED_FILTER}`
    );
    const agentRec = agentAgingData.records?.[0] || {};
    const avgAgentMinutes = fmt(agentRec.avgAgentAging);
    const agentAgingCount = fmt(agentRec.agentAgingCount);

    // Q5: Cycle time (closed cases via Ticket_Aging__c)
    const cycleData = runSOQL(
      `SELECT AVG(Ticket_Aging__c) avgCycleTime, COUNT(Id) cycleCount FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND ClosedDate != null AND Sub_Category__c != 'Spam' AND Status = 'Closed'`
    );
    const cycleRec = cycleData.records?.[0] || {};
    const avgCycleMinutes = fmt(cycleRec.avgCycleTime);
    const cycleCount = fmt(cycleRec.cycleCount);

    res.json({
      slaAchievement,
      totalCases: totalSLA,
      metCount,
      breachedCount,
      avgFRTMinutes,
      frtCount,
      avgAgingMinutes,
      avgAgingDays: +(avgAgingMinutes / 1440).toFixed(2),
      agingCount,
      avgAgentMinutes,
      avgAgentDays: +(avgAgentMinutes / 1440).toFixed(2),
      agentAgingCount,
      avgCycleMinutes,
      avgCycleDays: +(avgCycleMinutes / 1440).toFixed(2),
      cycleCount,
      _source: 'salesforce',
      _updated: new Date().toISOString(),
      _days: days,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, _source: 'error' });
  }
});


/* ─────────────────────────────────────────────────────────
   SECTION 3: SLA % Trend (Monthly, by channel)
   GET /api/sla/trend?months=6
   ───────────────────────────────────────────────────────── */
router.get('/trend', (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const days = months * 30;

    // Query A: Total cases per month per channel
    const totalData = runSOQL(
      `SELECT CALENDAR_MONTH(CreatedDate) month, CALENDAR_YEAR(CreatedDate) year, Origin, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND ${SPAM_MERGED_FILTER} AND Origin IN ${CHANNELS} GROUP BY CALENDAR_MONTH(CreatedDate), CALENDAR_YEAR(CreatedDate), Origin ORDER BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)`
    );

    // Query B: SLA-met cases per month per channel
    const metData = runSOQL(
      `SELECT CALENDAR_MONTH(CreatedDate) month, CALENDAR_YEAR(CreatedDate) year, Origin, COUNT(Id) metSLA FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND SLA_Breached__c = false AND ${SPAM_MERGED_FILTER} AND Origin IN ${CHANNELS} GROUP BY CALENDAR_MONTH(CreatedDate), CALENDAR_YEAR(CreatedDate), Origin ORDER BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)`
    );

    // Merge: build monthKey -> channel -> { total, met }
    const map = {};
    (totalData.records || []).forEach(r => {
      const key = `${r.year}-${r.month}`;
      if (!map[key]) map[key] = { year: r.year, month: r.month, label: monthLabel(r.year, r.month), channels: {} };
      if (!map[key].channels[r.Origin]) map[key].channels[r.Origin] = { total: 0, met: 0 };
      map[key].channels[r.Origin].total = r.total;
    });
    (metData.records || []).forEach(r => {
      const key = `${r.year}-${r.month}`;
      if (!map[key]) map[key] = { year: r.year, month: r.month, label: monthLabel(r.year, r.month), channels: {} };
      if (!map[key].channels[r.Origin]) map[key].channels[r.Origin] = { total: 0, met: 0 };
      map[key].channels[r.Origin].met = r.metSLA;
    });

    // Build sorted trend array
    const trend = Object.values(map)
      .sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month))
      .map(m => {
        const row = { month: m.label };
        let totalAll = 0, metAll = 0;
        Object.entries(m.channels).forEach(([ch, v]) => {
          const pct = v.total > 0 ? +((v.met / v.total) * 100).toFixed(1) : 0;
          row[ch] = pct;
          row[`${ch}_total`] = v.total;
          row[`${ch}_met`] = v.met;
          totalAll += v.total;
          metAll += v.met;
        });
        row.overall = totalAll > 0 ? +((metAll / totalAll) * 100).toFixed(1) : 0;
        row.overall_total = totalAll;
        row.overall_met = metAll;
        return row;
      });

    // Unique channel list
    const channelList = [...new Set((totalData.records || []).map(r => r.Origin))].sort();

    res.json({
      trend,
      channels: channelList,
      _source: 'salesforce',
      _updated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message, _source: 'error' });
  }
});


/* ─────────────────────────────────────────────────────────
   SECTION 4: FRT Trend (Monthly bar chart, by channel)
   GET /api/sla/frt-trend?months=6
   ───────────────────────────────────────────────────────── */
router.get('/frt-trend', (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const days = months * 30;

    const data = runSOQL(
      `SELECT CALENDAR_MONTH(CreatedDate) month, CALENDAR_YEAR(CreatedDate) year, Origin, AVG(X1st_agent_response_time__c) avgFRT, COUNT(Id) frtCount FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND X1st_agent_response_time__c > 0 AND X1st_agent_response_time__c < 14400 AND ${SPAM_MERGED_FILTER} AND Origin IN ${CHANNELS} GROUP BY CALENDAR_MONTH(CreatedDate), CALENDAR_YEAR(CreatedDate), Origin ORDER BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)`
    );

    const map = {};
    (data.records || []).forEach(r => {
      const key = `${r.year}-${r.month}`;
      if (!map[key]) map[key] = { year: r.year, month: r.month, label: monthLabel(r.year, r.month), channels: {} };
      map[key].channels[r.Origin] = { avgFRT: +r.avgFRT.toFixed(1), count: r.frtCount };
    });

    const trend = Object.values(map)
      .sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month))
      .map(m => {
        const row = { month: m.label };
        Object.entries(m.channels).forEach(([ch, v]) => {
          row[ch] = v.avgFRT; // in minutes
          row[`${ch}_count`] = v.count;
        });
        return row;
      });

    const channelList = [...new Set((data.records || []).map(r => r.Origin))].sort();

    res.json({
      trend,
      channels: channelList,
      _source: 'salesforce',
      _updated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message, _source: 'error' });
  }
});


/* ─────────────────────────────────────────────────────────
   SECTION 5: Cycle Time Trend (Ticket Aging + Agent Aging)
   GET /api/sla/cycle-trend?months=6
   ───────────────────────────────────────────────────────── */
router.get('/cycle-trend', (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const days = months * 30;

    // Ticket aging for closed cases
    const ticketData = runSOQL(
      `SELECT CALENDAR_MONTH(CreatedDate) month, CALENDAR_YEAR(CreatedDate) year, Origin, AVG(Ticket_Aging__c) avgAging, COUNT(Id) agingCount FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Ticket_Aging__c > 0 AND Status IN ('Closed', 'Resolved') AND Sub_Category__c != 'Spam' AND Origin IN ${CHANNELS} GROUP BY CALENDAR_MONTH(CreatedDate), CALENDAR_YEAR(CreatedDate), Origin ORDER BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)`
    );

    // Agent aging
    const agentData = runSOQL(
      `SELECT CALENDAR_MONTH(CreatedDate) month, CALENDAR_YEAR(CreatedDate) year, Origin, AVG(Agent_Aging__c) avgAgentAging, COUNT(Id) agentCount FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Agent_Aging__c > 0 AND ${SPAM_MERGED_FILTER} AND Origin IN ${CHANNELS} GROUP BY CALENDAR_MONTH(CreatedDate), CALENDAR_YEAR(CreatedDate), Origin ORDER BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)`
    );

    // Build combined per-month aggregation (across all channels)
    const map = {};
    (ticketData.records || []).forEach(r => {
      const key = `${r.year}-${r.month}`;
      if (!map[key]) map[key] = { year: r.year, month: r.month, label: monthLabel(r.year, r.month), ticketAgingSum: 0, ticketAgingCount: 0, agentAgingSum: 0, agentAgingCount: 0, byChannel: {} };
      map[key].ticketAgingSum += r.avgAging * r.agingCount;
      map[key].ticketAgingCount += r.agingCount;
      if (!map[key].byChannel[r.Origin]) map[key].byChannel[r.Origin] = {};
      map[key].byChannel[r.Origin].ticketAging = +(r.avgAging / 1440).toFixed(2);
      map[key].byChannel[r.Origin].ticketCount = r.agingCount;
    });
    (agentData.records || []).forEach(r => {
      const key = `${r.year}-${r.month}`;
      if (!map[key]) map[key] = { year: r.year, month: r.month, label: monthLabel(r.year, r.month), ticketAgingSum: 0, ticketAgingCount: 0, agentAgingSum: 0, agentAgingCount: 0, byChannel: {} };
      map[key].agentAgingSum += r.avgAgentAging * r.agentCount;
      map[key].agentAgingCount += r.agentCount;
      if (!map[key].byChannel[r.Origin]) map[key].byChannel[r.Origin] = {};
      map[key].byChannel[r.Origin].agentAging = +(r.avgAgentAging / 1440).toFixed(2);
      map[key].byChannel[r.Origin].agentCount = r.agentCount;
    });

    const trend = Object.values(map)
      .sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month))
      .map(m => ({
        month: m.label,
        ticketAgingDays: m.ticketAgingCount > 0 ? +((m.ticketAgingSum / m.ticketAgingCount) / 1440).toFixed(2) : 0,
        agentAgingDays: m.agentAgingCount > 0 ? +((m.agentAgingSum / m.agentAgingCount) / 1440).toFixed(2) : 0,
        waitTimeDays: m.ticketAgingCount > 0 && m.agentAgingCount > 0
          ? +(((m.ticketAgingSum / m.ticketAgingCount) - (m.agentAgingSum / m.agentAgingCount)) / 1440).toFixed(2)
          : 0,
        ticketCount: m.ticketAgingCount,
        agentCount: m.agentAgingCount,
        byChannel: m.byChannel,
      }));

    res.json({
      trend,
      _source: 'salesforce',
      _updated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message, _source: 'error' });
  }
});


/* ─────────────────────────────────────────────────────────
   SECTION 6: SLA by Ticket Category (Heatmap)
   GET /api/sla/by-category?days=90
   ───────────────────────────────────────────────────────── */
router.get('/by-category', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;

    // Total by category + channel
    const totalData = runSOQL(
      `SELECT Ticket_Category__c, Origin, COUNT(Id) total FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND ${SPAM_MERGED_FILTER} AND Ticket_Category__c != null GROUP BY Ticket_Category__c, Origin`
    );

    // Met SLA by category + channel
    const metData = runSOQL(
      `SELECT Ticket_Category__c, Origin, COUNT(Id) met FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND SLA_Breached__c = false AND ${SPAM_MERGED_FILTER} AND Ticket_Category__c != null GROUP BY Ticket_Category__c, Origin`
    );

    // Build map: category -> channel -> { total, met }
    const catMap = {};
    (totalData.records || []).forEach(r => {
      const cat = r.Ticket_Category__c;
      if (!catMap[cat]) catMap[cat] = {};
      if (!catMap[cat][r.Origin]) catMap[cat][r.Origin] = { total: 0, met: 0 };
      catMap[cat][r.Origin].total = r.total;
    });
    (metData.records || []).forEach(r => {
      const cat = r.Ticket_Category__c;
      if (!catMap[cat]) catMap[cat] = {};
      if (!catMap[cat][r.Origin]) catMap[cat][r.Origin] = { total: 0, met: 0 };
      catMap[cat][r.Origin].met = r.met;
    });

    // Build heatmap rows
    const channels = [...new Set([...(totalData.records || []).map(r => r.Origin)])].sort();
    const rows = Object.entries(catMap).map(([cat, chMap]) => {
      const row = { category: cat };
      let allTotal = 0, allMet = 0;
      channels.forEach(ch => {
        const v = chMap[ch] || { total: 0, met: 0 };
        const pct = v.total > 0 ? +((v.met / v.total) * 100).toFixed(1) : null;
        row[ch] = pct;
        row[`${ch}_total`] = v.total;
        row[`${ch}_met`] = v.met;
        allTotal += v.total;
        allMet += v.met;
      });
      row.all = allTotal > 0 ? +((allMet / allTotal) * 100).toFixed(1) : null;
      row.all_total = allTotal;
      row.all_met = allMet;
      return row;
    }).sort((a, b) => b.all_total - a.all_total);

    res.json({
      rows,
      channels,
      _source: 'salesforce',
      _updated: new Date().toISOString(),
      _days: days,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, _source: 'error' });
  }
});


/* ─────────────────────────────────────────────────────────
   SECTION 7: SLA by Sub-Category (Drill-down)
   GET /api/sla/by-subcategory?days=90&category=Application
   ───────────────────────────────────────────────────────── */
router.get('/by-subcategory', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const category = req.query.category;
    if (!category) return res.status(400).json({ error: 'category parameter required' });

    const safeCat = category.replace(/'/g, "\\'");

    // Total with FRT and aging
    const totalData = runSOQL(
      `SELECT Sub_Category__c, COUNT(Id) total, AVG(X1st_agent_response_time__c) avgFRT, AVG(Ticket_Aging__c) avgAging FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Ticket_Category__c = '${safeCat}' AND Sub_Category__c != 'Spam' AND Status != 'Merged' AND X1st_agent_response_time__c > 0 GROUP BY Sub_Category__c ORDER BY COUNT(Id) DESC`
    );

    // SLA met by subcategory
    const metData = runSOQL(
      `SELECT Sub_Category__c, COUNT(Id) met FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Ticket_Category__c = '${safeCat}' AND SLA_Breached__c = false AND Sub_Category__c != 'Spam' AND Status != 'Merged' GROUP BY Sub_Category__c`
    );

    // Total volume by subcategory (including cases without FRT for accurate volume)
    const volData = runSOQL(
      `SELECT Sub_Category__c, COUNT(Id) vol FROM Case WHERE CreatedDate = LAST_N_DAYS:${days} AND Ticket_Category__c = '${safeCat}' AND Sub_Category__c != 'Spam' AND Status != 'Merged' GROUP BY Sub_Category__c ORDER BY COUNT(Id) DESC`
    );

    const metMap = {};
    (metData.records || []).forEach(r => { metMap[r.Sub_Category__c] = r.met; });
    const volMap = {};
    (volData.records || []).forEach(r => { volMap[r.Sub_Category__c] = r.vol; });

    const rows = (totalData.records || []).map(r => {
      const vol = volMap[r.Sub_Category__c] || r.total;
      const met = metMap[r.Sub_Category__c] || 0;
      return {
        subCategory: r.Sub_Category__c,
        volume: vol,
        frtVolume: r.total,
        slaPct: vol > 0 ? +((met / vol) * 100).toFixed(1) : 0,
        avgFRTMinutes: r.avgFRT ? +r.avgFRT.toFixed(1) : 0,
        avgAgingDays: r.avgAging ? +(r.avgAging / 1440).toFixed(2) : 0,
      };
    });

    // Also include subcategories that had no FRT data
    const frtSubs = new Set(rows.map(r => r.subCategory));
    (volData.records || []).forEach(r => {
      if (!frtSubs.has(r.Sub_Category__c)) {
        const met = metMap[r.Sub_Category__c] || 0;
        rows.push({
          subCategory: r.Sub_Category__c,
          volume: r.vol,
          frtVolume: 0,
          slaPct: r.vol > 0 ? +((met / r.vol) * 100).toFixed(1) : 0,
          avgFRTMinutes: null,
          avgAgingDays: null,
        });
      }
    });

    rows.sort((a, b) => b.volume - a.volume);

    res.json({
      category,
      rows,
      _source: 'salesforce',
      _updated: new Date().toISOString(),
      _days: days,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, _source: 'error' });
  }
});


/* ─────────────────────────────────────────────────────────
   SECTION 8: Monthly Management Summary
   GET /api/sla/monthly-summary?year=2026&month=2
   ───────────────────────────────────────────────────────── */
router.get('/monthly-summary', (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;

    const { start, end } = buildMonthRange(year, month);
    const prior = buildPriorMonthRange(year, month);
    const dateFilter = `CreatedDate >= ${start} AND CreatedDate < ${end}`;
    const priorDateFilter = `CreatedDate >= ${prior.start} AND CreatedDate < ${prior.end}`;

    // Current month: total + met by channel
    const curTotal = runSOQL(
      `SELECT Origin, COUNT(Id) total FROM Case WHERE ${dateFilter} AND ${SPAM_MERGED_FILTER} AND Origin IN ${CHANNELS} GROUP BY Origin`
    );
    const curMet = runSOQL(
      `SELECT Origin, COUNT(Id) met FROM Case WHERE ${dateFilter} AND SLA_Breached__c = false AND ${SPAM_MERGED_FILTER} AND Origin IN ${CHANNELS} GROUP BY Origin`
    );
    const curFRT = runSOQL(
      `SELECT Origin, AVG(X1st_agent_response_time__c) avgFRT FROM Case WHERE ${dateFilter} AND X1st_agent_response_time__c > 0 AND X1st_agent_response_time__c < 14400 AND ${SPAM_MERGED_FILTER} AND Origin IN ${CHANNELS} GROUP BY Origin`
    );

    // Prior month: total + met by channel
    const priorTotal = runSOQL(
      `SELECT Origin, COUNT(Id) total FROM Case WHERE ${priorDateFilter} AND ${SPAM_MERGED_FILTER} AND Origin IN ${CHANNELS} GROUP BY Origin`
    );
    const priorMet = runSOQL(
      `SELECT Origin, COUNT(Id) met FROM Case WHERE ${priorDateFilter} AND SLA_Breached__c = false AND ${SPAM_MERGED_FILTER} AND Origin IN ${CHANNELS} GROUP BY Origin`
    );

    // Build channel breakdown
    const curTotalMap = {};
    (curTotal.records || []).forEach(r => { curTotalMap[r.Origin] = r.total; });
    const curMetMap = {};
    (curMet.records || []).forEach(r => { curMetMap[r.Origin] = r.met; });
    const curFRTMap = {};
    (curFRT.records || []).forEach(r => { curFRTMap[r.Origin] = r.avgFRT; });
    const priorTotalMap = {};
    (priorTotal.records || []).forEach(r => { priorTotalMap[r.Origin] = r.total; });
    const priorMetMap = {};
    (priorMet.records || []).forEach(r => { priorMetMap[r.Origin] = r.met; });

    const allChannels = [...new Set([...Object.keys(curTotalMap), ...Object.keys(priorTotalMap)])].sort();
    let overallTotal = 0, overallMet = 0, priorOverallTotal = 0, priorOverallMet = 0;

    const channelBreakdown = allChannels.map(ch => {
      const cTotal = curTotalMap[ch] || 0;
      const cMet = curMetMap[ch] || 0;
      const cFRT = curFRTMap[ch] || 0;
      const pTotal = priorTotalMap[ch] || 0;
      const pMet = priorMetMap[ch] || 0;
      const cSLA = cTotal > 0 ? +((cMet / cTotal) * 100).toFixed(1) : 0;
      const pSLA = pTotal > 0 ? +((pMet / pTotal) * 100).toFixed(1) : 0;

      overallTotal += cTotal;
      overallMet += cMet;
      priorOverallTotal += pTotal;
      priorOverallMet += pMet;

      return {
        channel: ch,
        volume: cTotal,
        slaPct: cSLA,
        avgFRTMinutes: +cFRT.toFixed(1),
        priorSlaPct: pSLA,
        deltapp: +(cSLA - pSLA).toFixed(1),
      };
    });

    const overallSLA = overallTotal > 0 ? +((overallMet / overallTotal) * 100).toFixed(1) : 0;
    const priorOverallSLA = priorOverallTotal > 0 ? +((priorOverallMet / priorOverallTotal) * 100).toFixed(1) : 0;

    // Worst SLA categories for this month
    const catTotal = runSOQL(
      `SELECT Ticket_Category__c, COUNT(Id) total FROM Case WHERE ${dateFilter} AND ${SPAM_MERGED_FILTER} AND Ticket_Category__c != null GROUP BY Ticket_Category__c ORDER BY COUNT(Id) DESC`
    );
    const catMet = runSOQL(
      `SELECT Ticket_Category__c, COUNT(Id) met FROM Case WHERE ${dateFilter} AND SLA_Breached__c = false AND ${SPAM_MERGED_FILTER} AND Ticket_Category__c != null GROUP BY Ticket_Category__c`
    );
    const catMetMap = {};
    (catMet.records || []).forEach(r => { catMetMap[r.Ticket_Category__c] = r.met; });

    const worstCategories = (catTotal.records || []).map(r => {
      const met = catMetMap[r.Ticket_Category__c] || 0;
      const breached = r.total - met;
      return {
        category: r.Ticket_Category__c,
        total: r.total,
        breached,
        slaPct: r.total > 0 ? +((met / r.total) * 100).toFixed(1) : 100,
      };
    }).sort((a, b) => a.slaPct - b.slaPct).slice(0, 5);

    // Auto-generate observations
    const observations = [];
    const improvements = [...channelBreakdown].sort((a, b) => b.deltapp - a.deltapp);
    if (improvements.length > 0 && improvements[0].deltapp > 0) {
      observations.push(`${improvements[0].channel} improved by ${improvements[0].deltapp}pp (${improvements[0].priorSlaPct}% -> ${improvements[0].slaPct}%)`);
    }
    const declines = [...channelBreakdown].sort((a, b) => a.deltapp - b.deltapp);
    if (declines.length > 0 && declines[0].deltapp < 0) {
      observations.push(`${declines[0].channel} declined by ${Math.abs(declines[0].deltapp)}pp - investigate`);
    }
    if (worstCategories.length > 0 && worstCategories[0].slaPct < 90) {
      observations.push(`"${worstCategories[0].category}" has lowest SLA at ${worstCategories[0].slaPct}% (${worstCategories[0].breached} breaches)`);
    }

    const priorMonthLabel = monthLabel(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);

    res.json({
      monthLabel: monthLabel(year, month),
      year,
      month,
      overallSLA,
      priorOverallSLA,
      overallDelta: +(overallSLA - priorOverallSLA).toFixed(1),
      totalVolume: overallTotal,
      channelBreakdown,
      worstCategories,
      observations,
      priorMonthLabel,
      _source: 'salesforce',
      _updated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message, _source: 'error' });
  }
});

module.exports = router;
