import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ collapsed }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
        width: '100%',
        padding: collapsed ? '10px 0' : '10px 20px',
        background: 'transparent',
        color: 'var(--text-muted)',
        border: 'none',
        borderTop: '1px solid var(--border)',
        cursor: 'pointer',
        fontSize: 13,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
    </button>
  );
}
