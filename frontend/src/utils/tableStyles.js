/* ── Shared Table Inline Styles ──
   Single source of truth for table header/cell styling.
   Import instead of redeclaring thStyle/tdStyle per page.
*/

export const thStyle = {
  padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600,
  color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
  background: 'var(--bg-primary)', textTransform: 'uppercase', letterSpacing: '0.5px',
};

export const tdStyle = {
  padding: '8px 12px', textAlign: 'right', fontSize: 13,
  fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border)',
};

export const thLeft = { ...thStyle, textAlign: 'left' };
export const tdLeft = { ...tdStyle, textAlign: 'left', fontFamily: 'inherit', fontWeight: 500 };

/* Compact variant (used in ChannelMix, CSATAnalysis) */
export const thCompact = {
  ...thStyle, textAlign: 'left', fontSize: 10,
};
export const tdCompact = {
  ...tdStyle, textAlign: 'left', fontSize: 12, fontFamily: 'inherit',
};
