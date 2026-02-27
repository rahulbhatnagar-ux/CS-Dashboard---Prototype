import React, { useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';

export default function DataTable({ columns, data, pageSize = 10, mock }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => columns.some(c => String(r[c.key] ?? '').toLowerCase().includes(q)));
    }
    if (sortCol !== null) {
      rows.sort((a, b) => {
        const av = a[columns[sortCol].key], bv = b[columns[sortCol].key];
        const cmp = typeof av === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, search, sortCol, sortDir, columns]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (i) => {
    if (sortCol === i) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(i); setSortDir('asc'); }
  };

  const exportCSV = () => {
    const header = columns.map(c => c.label).join(',');
    const rows = filtered.map(r => columns.map(c => JSON.stringify(r[c.key] ?? '')).join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'export.csv'; a.click();
  };

  return (
    <div className={mock ? 'mock-highlight' : ''} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <Search size={14} style={{ color: 'var(--text-muted)' }} />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search..." style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13 }} />
        <button onClick={exportCSV} className="btn-ghost" style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Download size={12} /> CSV
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} onClick={() => handleSort(i)} style={{
                  padding: '10px 16px', textAlign: c.align || 'left', cursor: 'pointer',
                  color: 'var(--text-muted)', fontWeight: 500, fontSize: 12,
                  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                  background: 'var(--bg-primary)',
                }}>
                  {c.label} {sortCol === i ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 ? 'var(--bg-card)' : 'var(--bg-stripe-strong)' }}>
                {columns.map((c, ci) => (
                  <td key={ci} style={{
                    padding: '10px 16px', textAlign: c.align || 'left',
                    borderBottom: '1px solid var(--border)',
                    fontFamily: c.mono ? 'var(--font-mono)' : 'inherit',
                  }}>
                    {c.render ? c.render(row[c.key], row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr><td colSpan={columns.length} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>{filtered.length} rows</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span style={{ padding: '2px 8px' }}>{page + 1}/{totalPages}</span>
            <button className="btn-ghost" style={{ padding: '2px 8px', fontSize: 11 }} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
