import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeToggle from '../ThemeToggle';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'light';
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('ThemeToggle', () => {
  it('updates all mounted controls and saves the choice', () => {
    render(<><ThemeToggle /><ThemeToggle /></>);
    fireEvent.click(screen.getAllByRole('button', { name: 'Switch to dark theme' })[0]);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('udaan-theme')).toBe('dark');
    expect(screen.getAllByRole('button', { name: 'Switch to light theme' })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Switch to light theme' })[1]);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('udaan-theme')).toBe('light');
  });

  it('keeps the selected theme when a page mounts a new toggle', () => {
    const first = render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    first.unmount();
    render(<ThemeToggle />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Switch to light theme');
  });

  it('still switches when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
