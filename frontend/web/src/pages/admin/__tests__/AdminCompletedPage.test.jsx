import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminCompletedPage from '../AdminCompletedPage';
import * as apiClient from '../../../api/client';
import * as authContext from '../../../context/AuthContext';

vi.mock('../../../api/client', () => ({
  getAdminWorkshopRequestsApi: vi.fn(),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { full_name: 'Admin User', role: 'ADMIN' },
    logout: vi.fn(),
  })),
}));

const mockCompletedZero = {
  id: 'comp-1',
  institution_name: 'Govt PU College Hubballi',
  institution_type: 'GOVERNMENT_COLLEGE',
  district: 'Dharwad',
  preferred_mode: 'offline',
  schedule: {
    actual_attendance: 0,
    feedback_score: 0,
    scheduled_start: '2026-10-10T10:00:00Z',
    completed_at: '2026-10-10T12:00:00Z',
    duration_minutes: 90,
    assigned_facilitator: 'Dr. Ramesh',
    venue_or_meeting_link: 'Campus Hall',
    completion_notes: 'Turnout was zero due to local bandh.',
  },
  contact_name: 'Prof. Joshi',
  contact_phone: '+91 9988776655',
  contact_email: 'joshi@govt.edu.in',
  status: 'COMPLETED',
};

const mockCompletedNull = {
  id: 'comp-2',
  institution_name: 'St Anthony High School',
  institution_type: 'PRIVATE_AIDED',
  district: 'Belagavi',
  preferred_mode: 'online',
  schedule: {
    actual_attendance: null,
    feedback_score: null,
    scheduled_start: '2026-10-12T10:00:00Z',
    completed_at: '2026-10-12T11:30:00Z',
    duration_minutes: 60,
    assigned_facilitator: null,
    venue_or_meeting_link: 'https://meet.google.com/test',
  },
  contact_name: 'Sister Clara',
  contact_phone: '+91 9123456789',
  contact_email: 'clara@stanthony.org',
  status: 'COMPLETED',
};

describe('AdminCompletedPage Zero-Value and Null Display', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authContext.useAuth.mockReturnValue({
      user: { full_name: 'Admin User', role: 'ADMIN' },
      logout: vi.fn(),
    });
  });

  it('correctly displays 0 for attendance and feedback rating instead of — in table and drawer', async () => {
    apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockCompletedZero]);

    render(
      <MemoryRouter initialEntries={['/admin/completed']}>
        <AdminCompletedPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Govt PU College Hubballi')).toBeTruthy();
    });

    // In table: 0 attendance displays "0 students" and rating displays "0"
    expect(screen.getByText('0 students')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();

    // Click row to open audit drawer
    fireEvent.click(screen.getByText('Govt PU College Hubballi'));

    await waitFor(() => {
      expect(screen.getByText('Conducted & Verified')).toBeTruthy();
    });

    // In drawer metrics: Actual Attendees displays "0" and Feedback Score displays "0 / 5.0"
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('0 / 5.0')).toBeTruthy();
  });

  it('displays — for unknown/null attendance and feedback score', async () => {
    apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockCompletedNull]);

    render(
      <MemoryRouter initialEntries={['/admin/completed']}>
        <AdminCompletedPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('St Anthony High School')).toBeTruthy();
    });

    // In table: dashes are displayed
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);

    // Open drawer
    fireEvent.click(screen.getByText('St Anthony High School'));

    await waitFor(() => {
      expect(screen.getByText('Conducted & Verified')).toBeTruthy();
    });

    // Should not crash and drawer metrics should show dashes
    const drawerDashes = screen.getAllByText('—');
    expect(drawerDashes.length).toBeGreaterThan(0);
  });

  describe('AdminCompletedPage Loading and Error Recovery', () => {
    it('handles initial load failure without showing "No completed workshops yet", and recovers on Retry', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Archive database temporarily offline.',
          },
        },
      });

      render(
        <MemoryRouter initialEntries={['/admin/completed']}>
          <AdminCompletedPage />
        </MemoryRouter>
      );

      // Verify error alert
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Archive database temporarily offline.');
      });

      // Verify empty list success message is NOT displayed
      expect(screen.queryByText('No completed workshops yet')).toBeNull();
      expect(screen.queryByRole('table')).toBeNull();

      // Click Retry to recover
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValueOnce([mockCompletedZero]);

      const retryBtn = screen.getByRole('button', { name: /^Retry$/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByText('Govt PU College Hubballi')).toBeTruthy();
      });
    });

    it('marks retained data as stale on refresh failure, and clears stale state on successful Retry', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValueOnce([mockCompletedZero]);

      render(
        <MemoryRouter initialEntries={['/admin/completed']}>
          <AdminCompletedPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt PU College Hubballi')).toBeTruthy();
      });

      // Simulate refresh failure
      apiClient.getAdminWorkshopRequestsApi.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Refresh failed due to network reset.',
          },
        },
      });

      const refreshBtn = screen.getByRole('button', { name: /Refresh Records/i });
      fireEvent.click(refreshBtn);

      // Verify stale banner
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Showing cached data (data may be stale).');
        expect(alert.textContent).toContain('Refresh failed due to network reset.');
      });

      // Retained records still visible
      expect(screen.getByText('Govt PU College Hubballi')).toBeTruthy();

      // Retry from stale alert succeeds
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValueOnce([mockCompletedZero]);

      const retryBtn = screen.getByRole('button', { name: /^Retry$/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByText('Govt PU College Hubballi')).toBeTruthy();
      });
    });
  });
});
