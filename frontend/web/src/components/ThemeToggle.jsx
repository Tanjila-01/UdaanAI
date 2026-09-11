import React, { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

const key = 'udaan-theme';
const subscribe = (callback) => {
  window.addEventListener('udaan-theme-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('udaan-theme-change', callback);
    window.removeEventListener('storage', callback);
  };
};
const getTheme = () => document.documentElement.dataset.theme || 'light';

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light');
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(key, next); } catch { /* Theme still works without storage. */ }
    window.dispatchEvent(new Event('udaan-theme-change'));
  };

  return (
    <button type="button" onClick={toggle} aria-label={label} title={label}
      className="theme-toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
      {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
