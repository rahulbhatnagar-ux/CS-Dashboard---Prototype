/* ── Shared Recharts Config ──
   Single source of truth for chart styling across all pages.
   Import instead of redeclaring tooltipStyle/tickStyle/gridStroke per page.
*/

export const tooltipStyle = {
  background: 'var(--chart-tooltip-bg, #1C1835)',
  border: '1px solid var(--chart-tooltip-border, #3D3568)',
  borderRadius: 8,
  fontSize: 12,
};

export const tickStyle = { fill: 'var(--chart-tick, #9690B0)', fontSize: 11 };

export const gridStroke = 'var(--chart-grid, #2D2650)';

/* Channel color palette — used in ChannelMix, SLAAnalysis, CSATAnalysis */
export const CHANNEL_COLORS = {
  'Help Center': '#7B61FF',
  'Live Chat':   '#00D09C',
  'In-App':      '#FFB020',
  'Email':       '#FF4757',
  'EmailCase':   '#FF4757',
  'Phone':       '#A78BFA',
  'L1 Agent':    '#36D7B7',
  'Play Store':  '#FF6B6B',
  'Instagram':   '#B388FF',
  'Live Chatbot Case': '#7B61FF',
};
