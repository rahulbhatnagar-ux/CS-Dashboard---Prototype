/* ── Shared Formatters ──
   Date, number, and text formatting helpers used across pages.
*/

/** Format ISO date string to "Mon DD, YYYY" */
export const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '—'; }
};

/** Format minutes into human-readable duration (e.g. "2h 30m", "3.5d") */
export const fmtDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
};

/** Format number with commas (e.g. 12345 → "12,345") */
export const fmtNum = (n) => {
  if (n == null) return '—';
  return Number(n).toLocaleString();
};

/** Format percentage (e.g. 0.856 → "85.6%") */
export const fmtPct = (n, decimals = 1) => {
  if (n == null) return '—';
  return `${(n * 100).toFixed(decimals)}%`;
};
