import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminOverviewPage from '../AdminOverviewPage';
import * as apiClient from '../../../api/client';
import * as authContext from '../../../context/AuthContext';

vi.mock('../../../api/client', () => ({
  getAdminWorkshopOverviewApi: vi.fn(),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { full_name: 'Admin User', role: 'ADMIN' },
    logout: vi.fn(),
  })),
}));

const mockOverviewData = {
  metrics: {
    new_requests: 3,
    contacted_requests: 2,
    scheduled_workshops: 4,
    upcoming_this_week: 1,
    completed_workshops: 10,
  },
  recent_new_requests: [
    {
      id: 'req-1',
      institution_name: 'Govt PU College Dharwad',
      institution_type: 'GOVERNMENT_COLLEGE',
      district: 'Dharwad',
      preferred_mode: 'offline',
      student_count: 120,
      created_at: '2026-09-01T10:00:00Z',
    },
  ],
  upcoming_workshops: [
    {
      id: 'sch-1',
      institution_name: 'St Joseph School Belagavi',
      district: 'Belagavi',
      preferred_mode: 'online',
      schedule: {
        scheduled_start: '2026-10-15T10:30:00Z',
        mode: 'online',
        assigned_facilitator: 'Dr. Ramesh',
      },
    },
  ],
};

describe('AdminOverviewPage Loading and Error Recovery', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authContext.useAuth.mockReturnValue({
      user: { full_name: 'Admin User', role: 'ADMIN' },
      logout: vi.fn(),
    });
  });

  it('handles initial load failure without showing zero metrics or "all reviewed", and recovers on Retry', async () => {
    apiClient.getAdminWorkshopOverviewApi.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Database cluster warming up; operational metrics unavailable.',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <AdminOverviewPage />
      </MemoryRouter>
    );

    // Verify initial load failure alert
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Database cluster warming up; operational metrics unavailable.');
    });

    // Verify zero metrics tiles and "all reviewed" / "no workshops" messages are NOT shown
    expect(screen.queryByText(/Needs Review/i)).toBeNull();
    expect(screen.queryByText('All new requests have been reviewed!')).toBeNull();
    expect(screen.queryByText('No workshops scheduled right now.')).toBeNull();

    // Verify Retry button exists and works
    const retryBtn = screen.getByRole('button', { name: /^Retry$/i });
    apiClient.getAdminWorkshopOverviewApi.mockResolvedValueOnce(mockOverviewData);

    fireEvent.click(retryBtn);

    // On success: error is cleared and data is populated
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByText('Govt PU College Dharwad')).toBeTruthy();
      expect(screen.getByText('St Joseph School Belagavi')).toBeTruthy();
    });

    expect(screen.getByText(/Needs Review/i)).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
  });

  it('marks retained data as stale on refresh failure, and clears stale state on successful Retry', async () => {
    // 1. Initial success
    apiClient.getAdminWorkshopOverviewApi.mockResolvedValueOnce(mockOverviewData);

    render(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <AdminOverviewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Govt PU College Dharwad')).toBeTruthy();
      expect(screen.getByText('Live')).toBeTruthy();
    });

    // 2. Refresh failure
    apiClient.getAdminWorkshopOverviewApi.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Gateway timeout during refresh.',
        },
      },
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh Data/i });
    fireEvent.click(refreshBtn);

    // Verify stale data warning banner appears
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Showing cached data (data may be stale).');
      expect(alert.textContent).toContain('Gateway timeout during refresh.');
    });

    // Verify header badge indicates Stale
    expect(screen.getByText('Stale')).toBeTruthy();

    // Verify retained data is still visible
    expect(screen.getByText('Govt PU College Dharwad')).toBeTruthy();
    expect(screen.getByText('St Joseph School Belagavi')).toBeTruthy();

    // 3. Retry success from the stale alert
    apiClient.getAdminWorkshopOverviewApi.mockResolvedValueOnce(mockOverviewData);

    const retryBtn = screen.getByRole('button', { name: /^Retry$/i });
    fireEvent.click(retryBtn);

    // Stale alert dismissed, Live badge restored
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByText('Live')).toBeTruthy();
    });
  });
});
