import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminCompletedPage from '../AdminCompletedPage';
import * as apiClient from '../../../api/client';
import * as authContext from '../../../context/AuthContext';

vi.mock('../../../api/client', () => ({
  getAdminWorkshopRequestsApi: vi.fn(),
  getWorkshopFeedbackLinkApi: vi.fn(),
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
      expect(screen.getByText('Marked Completed')).toBeTruthy();
    });

    // In drawer metrics: Recorded Attendance displays "0" and Admin Feedback Rating displays "0 / 5.0"
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('0 / 5.0')).toBeTruthy();
    expect(screen.getByText('Completion Recorded')).toBeTruthy();
    expect(screen.getAllByText('Recorded Attendance').length).toBeGreaterThanOrEqual(1);
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
      expect(screen.getByText('Marked Completed')).toBeTruthy();
    });

    // Should not crash and drawer metrics should show dashes
    const drawerDashes = screen.getAllByText('—');
    expect(drawerDashes.length).toBeGreaterThan(0);
  });

  it('displays Awaiting coordinator feedback and handles Copy Feedback Link', async () => {
    const mockAwaiting = {
      ...mockCompletedZero,
      coordinator_feedback: {
        feedback_token: 'secret-tok-123',
        rating: null,
        comments: null,
        submitted_at: null,
      },
    };

    apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockCompletedZero]);
    apiClient.getWorkshopFeedbackLinkApi.mockResolvedValue({ feedback_url: '/workshops/feedback/secret-tok-123' });

    // Mock clipboard
    const writeTextMock = vi.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin/completed']}>
        <AdminCompletedPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Govt PU College Hubballi')).toBeTruthy();
    });

    // Table has Copy Link button
    const copyLinkBtns = screen.getAllByTitle('Copy Feedback Link');
    expect(copyLinkBtns.length).toBeGreaterThan(0);
    fireEvent.click(copyLinkBtns[0]);

    await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('/workshops/feedback/secret-tok-123')));
    expect(apiClient.getWorkshopFeedbackLinkApi).toHaveBeenCalledWith('comp-1');

    // Open drawer
    fireEvent.click(screen.getByText('Govt PU College Hubballi'));
    await waitFor(() => {
      expect(screen.getByText('Coordinator feedback via shared link')).toBeTruthy();
      expect(screen.getByText('Awaiting coordinator feedback')).toBeTruthy();
    });
  });

  it('displays coordinator submitted rating and comments separately from admin rating', async () => {
    const mockSubmitted = {
      ...mockCompletedZero,
      schedule: {
        ...mockCompletedZero.schedule,
        feedback_score: 3.5, // Admin rating
      },
      coordinator_feedback: {
        feedback_token: 'secret-tok-submitted',
        rating: 5, // Coordinator rating
        comments: 'Outstanding session for 10th graders.',
        submitted_at: '2026-10-15T14:30:00Z',
      },
    };

    apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockSubmitted]);

    render(
      <MemoryRouter initialEntries={['/admin/completed']}>
        <AdminCompletedPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Govt PU College Hubballi')).toBeTruthy();
    });

    // Open drawer
    fireEvent.click(screen.getByText('Govt PU College Hubballi'));

    await waitFor(() => {
      expect(screen.getByText('Coordinator feedback via shared link')).toBeTruthy();
      // Coordinator rating 5 / 5
      expect(screen.getByText('5 / 5')).toBeTruthy();
      expect(screen.getByText('"Outstanding session for 10th graders."')).toBeTruthy();
      // Admin rating 3.5 / 5.0 remains separate
      expect(screen.getByText('3.5 / 5.0')).toBeTruthy();
    });
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
