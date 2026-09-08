import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminRequestsPage from '../AdminRequestsPage';
import * as apiClient from '../../../api/client';
import * as authContext from '../../../context/AuthContext';

// Mock dependencies
vi.mock('../../../api/client', () => ({
  getAdminWorkshopRequestsApi: vi.fn(),
  markWorkshopContactedApi: vi.fn(),
  scheduleWorkshopApi: vi.fn(),
  updateWorkshopScheduleApi: vi.fn(),
  completeWorkshopApi: vi.fn(),
  cancelWorkshopApi: vi.fn(),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { full_name: 'Admin User', role: 'ADMIN' },
    logout: vi.fn(),
  })),
}));

const mockRequest1 = {
  id: 'req-1',
  institution_name: 'Govt PU College Dharwad',
  institution_type: 'GOVERNMENT_COLLEGE',
  district: 'Dharwad',
  city: 'Dharwad',
  contact_name: 'Principal Ramesh',
  contact_phone: '+91 9876543210',
  contact_email: 'ramesh@govt.edu.in',
  preferred_mode: 'offline',
  student_count: 120,
  preferred_date: '2026-10-15',
  preferred_topics: ['Engineering', 'Medical'],
  message: 'Please arrange morning slot',
  status: 'NEW',
  schedule: null,
  created_at: '2026-09-01T10:00:00Z',
};

const mockRequest2 = {
  id: 'req-2',
  institution_name: 'St Joseph School Belagavi',
  institution_type: 'AIDED_SCHOOL',
  district: 'Belagavi',
  city: 'Belagavi',
  contact_name: 'Sister Mary',
  contact_phone: '+91 9123456780',
  contact_email: 'mary@stjoseph.org',
  preferred_mode: 'online',
  student_count: 85,
  preferred_date: '2026-11-20',
  preferred_topics: ['Commerce'],
  message: 'Online session needed',
  status: 'SCHEDULED',
  schedule: {
    id: 'sch-2',
    scheduled_start: '2026-11-20T14:30:00.000Z',
    duration_minutes: 60,
    mode: 'online',
    venue_or_meeting_link: 'https://meet.google.com/abc-defg-hij',
    assigned_facilitator: 'Dr. Suresh Kumar',
    internal_notes: 'Slides in Kannada',
  },
  created_at: '2026-09-02T10:00:00Z',
};

const mockRequest3 = {
  id: 'req-3',
  institution_name: 'National High School Bangalore',
  institution_type: 'PRIVATE_UNIFIED',
  district: 'Bengaluru Urban',
  city: 'Bengaluru',
  contact_name: 'Anita Roy',
  contact_phone: '+91 9988776655',
  contact_email: 'anita@national.edu',
  preferred_mode: 'online',
  student_count: 200,
  preferred_date: '2026-12-10',
  preferred_topics: ['Design'],
  message: '',
  status: 'NEW',
  schedule: null,
  created_at: '2026-09-03T10:00:00Z',
};

describe('AdminRequestsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authContext.useAuth.mockReturnValue({
      user: { full_name: 'Admin User', role: 'ADMIN' },
      logout: vi.fn(),
    });
  });

  describe('Status filter validation from URL', () => {
    it('applies validated ?status=NEW and fetches requests with status NEW', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1]);

      render(
        <MemoryRouter initialEntries={['/admin/requests?status=NEW']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiClient.getAdminWorkshopRequestsApi).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'NEW' })
        );
      });

      expect(screen.getByDisplayValue('Status: NEW Only')).toBeTruthy();
      expect(screen.getByText('Govt PU College Dharwad')).toBeTruthy();
    });

    it('defaults invalid ?status=INVALID_STATUS to ALL', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1, mockRequest2]);

      render(
        <MemoryRouter initialEntries={['/admin/requests?status=INVALID_STATUS']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiClient.getAdminWorkshopRequestsApi).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'ALL' })
        );
      });

      expect(screen.getByDisplayValue('Status: All Requests')).toBeTruthy();
    });

    it('defaults missing ?status to ALL', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1, mockRequest2]);

      render(
        <MemoryRouter initialEntries={['/admin/requests']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiClient.getAdminWorkshopRequestsApi).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'ALL' })
        );
      });

      expect(screen.getByDisplayValue('Status: All Requests')).toBeTruthy();
    });
  });

  describe('?open=<id> query resolution & drawer dismissal handling', () => {
    it('resolves ?open=<id> through handleOpenDrawer and initializes scheduling fields', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1, mockRequest2]);

      render(
        <MemoryRouter initialEntries={['/admin/requests?open=req-1']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      // Wait for request detail drawer to open
      await waitFor(() => {
        expect(screen.getByText('Coordinator Information')).toBeTruthy();
      });
      expect(screen.getAllByText('Principal Ramesh').length).toBeGreaterThan(0);

      // Open schedule modal
      const scheduleBtn = screen.getByRole('button', { name: /Schedule Workshop/i });
      fireEvent.click(scheduleBtn);

      // Verify scheduling fields were initialized from mockRequest1
      const dateInput = screen.getByLabelText(/Session Date/i);
      expect(dateInput.value).toBe('2026-10-15');

      const modeSelect = screen.getByLabelText(/Mode \*/i);
      expect(modeSelect.value).toBe('offline');
    });

    it('does not repeatedly reopen a dismissed drawer on URL / filter changes', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1, mockRequest2]);

      render(
        <MemoryRouter initialEntries={['/admin/requests?open=req-1']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      // Wait for drawer to open
      await waitFor(() => {
        expect(screen.getByText('Coordinator Information')).toBeTruthy();
      });

      // Dismiss drawer by clicking close X
      fireEvent.click(screen.getByRole('button', { name: /close drawer/i }));

      // Verify drawer is closed
      await waitFor(() => {
        expect(screen.queryByText('Coordinator Information')).toBeNull();
      });

      // Trigger a filter change
      const statusSelect = screen.getByDisplayValue('Status: All Requests');
      fireEvent.change(statusSelect, { target: { value: 'CONTACTED' } });

      // Drawer should remain closed, not repeatedly reopened
      await waitFor(() => {
        expect(apiClient.getAdminWorkshopRequestsApi).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'CONTACTED' })
        );
      });
      expect(screen.queryByText('Coordinator Information')).toBeNull();
    });

    it('with ?open=A, closing A then manually opening B must keep B open', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1, mockRequest2]);

      render(
        <MemoryRouter initialEntries={['/admin/requests?open=req-1']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      // 1. Drawer opens automatically for req-1 (A)
      await waitFor(() => {
        expect(screen.getByText('Coordinator Information')).toBeTruthy();
      });
      expect(screen.getAllByText('Principal Ramesh').length).toBeGreaterThan(0);

      // 2. User closes req-1 (A)
      fireEvent.click(screen.getByRole('button', { name: /close drawer/i }));

      await waitFor(() => {
        expect(screen.queryByText('Coordinator Information')).toBeNull();
      });

      // 3. User manually opens req-2 (B) from table
      const openButtons = screen.getAllByRole('button', { name: /Open/i });
      fireEvent.click(openButtons[1]);

      // 4. Drawer opens with req-2 (B) and STAYS open without getting overwritten by A
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'St Joseph School Belagavi' })).toBeTruthy();
      });
      expect(screen.getAllByText('Sister Mary').length).toBeGreaterThan(0);
    });

    it('correctly initializes different request forms when switching requests', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1, mockRequest2, mockRequest3]);

      render(
        <MemoryRouter initialEntries={['/admin/requests']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt PU College Dharwad')).toBeTruthy();
      });

      // Open Request 1 (offline, preferred_date 2026-10-15)
      const openButtons = screen.getAllByRole('button', { name: /Open/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Coordinator Information')).toBeTruthy();
      });

      fireEvent.click(screen.getByRole('button', { name: /Schedule Workshop/i }));
      expect(screen.getByLabelText(/Session Date/i).value).toBe('2026-10-15');
      expect(screen.getByLabelText(/Mode \*/i).value).toBe('offline');

      // Close schedule modal using its close button
      fireEvent.click(screen.getByRole('button', { name: /close schedule modal/i }));

      // Close drawer
      fireEvent.click(screen.getByRole('button', { name: /close drawer/i }));

      await waitFor(() => {
        expect(screen.queryByText('Coordinator Information')).toBeNull();
      });

      // Open Request 2 (already scheduled: date 2026-11-20, online, facilitator Dr. Suresh Kumar)
      const openButtons2 = screen.getAllByRole('button', { name: /Open/i });
      fireEvent.click(openButtons2[1]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'St Joseph School Belagavi' })).toBeTruthy();
      });

      fireEvent.click(screen.getByRole('button', { name: /Edit Schedule/i }));
      expect(screen.getByLabelText(/Session Date/i).value).toBe('2026-11-20');
      expect(screen.getByLabelText(/Mode \*/i).value).toBe('online');
      expect(screen.getByDisplayValue('https://meet.google.com/abc-defg-hij')).toBeTruthy();
      expect(screen.getByDisplayValue('Dr. Suresh Kumar')).toBeTruthy();
    });
  });

  describe('Reconciliation matching backend filters (preferred_mode and search)', () => {
    it('mode filters on preferred_mode, not schedule.mode', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1]);

      render(
        <MemoryRouter initialEntries={['/admin/requests']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt PU College Dharwad')).toBeTruthy();
      });

      // Change mode filter to offline
      const modeSelect = screen.getByDisplayValue('Mode: All Delivery Modes');
      fireEvent.change(modeSelect, { target: { value: 'offline' } });

      // Open drawer for mockRequest1 (preferred_mode: 'offline')
      const openBtn = await screen.findByRole('button', { name: /Open/i });
      fireEvent.click(openBtn);
      await waitFor(() => {
        expect(screen.getByText('Coordinator Information')).toBeTruthy();
      });

      // Schedule with schedule.mode = 'online'
      fireEvent.click(screen.getByRole('button', { name: /Schedule Workshop/i }));

      // Fill in required venue/meeting link
      fireEvent.change(screen.getByPlaceholderText(/School Main Auditorium/i), {
        target: { value: 'https://meet.google.com/xyz' },
      });

      const scheduledWithOnlineDelivery = {
        ...mockRequest1,
        status: 'SCHEDULED',
        preferred_mode: 'offline', // preferred_mode is still offline
        schedule: {
          id: 'sch-online',
          scheduled_start: '2026-10-15T10:30:00.000Z',
          duration_minutes: 90,
          mode: 'online', // schedule.mode is online
          venue_or_meeting_link: 'https://meet.google.com/xyz',
          assigned_facilitator: 'Dr. Srinivas',
        },
      };
      apiClient.scheduleWorkshopApi.mockResolvedValueOnce(scheduledWithOnlineDelivery);

      fireEvent.click(screen.getByRole('button', { name: /Confirm Schedule/i }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Schedule Workshop' })).toBeNull();
      });

      // Should REMAIN in the list because preferred_mode is 'offline'
      expect(screen.queryByText('No requests found')).toBeNull();
      expect(screen.getAllByText('Govt PU College Dharwad').length).toBeGreaterThan(0);
      expect(screen.getByRole('table')).toBeTruthy();
    });
  });

  describe('Scheduling failure → retry → success under a status filter', () => {
    it('shows normalized error inside dialog, preserves inputs, and reconciles list upon success', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1]);

      render(
        <MemoryRouter initialEntries={['/admin/requests?status=NEW']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt PU College Dharwad')).toBeTruthy();
      });

      // Open drawer for mockRequest1
      const openBtn = screen.getByRole('button', { name: /Open/i });
      fireEvent.click(openBtn);

      await waitFor(() => {
        expect(screen.getByText('Coordinator Information')).toBeTruthy();
      });

      // Open Schedule Workshop dialog
      fireEvent.click(screen.getByRole('button', { name: /Schedule Workshop/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Schedule Workshop' })).toBeTruthy();
      });

      // Fill in scheduling form details
      const venueInput = screen.getByPlaceholderText(/School Main Auditorium/i);
      fireEvent.change(venueInput, { target: { value: 'College Main Hall' } });

      const facilitatorInput = screen.getByPlaceholderText(/Dr\. K\. Srinivas/i);
      fireEvent.change(facilitatorInput, { target: { value: 'Dr. K. Srinivas' } });

      const notesInput = screen.getByPlaceholderText(/Auditorium key/i);
      fireEvent.change(notesInput, { target: { value: 'Kannada speaker requested' } });

      // 1. Simulate scheduling failure with FastAPI error
      apiClient.scheduleWorkshopApi.mockRejectedValueOnce({
        response: {
          data: {
            detail: [{ msg: 'Facilitator Dr. K. Srinivas is already booked at this time.' }],
          },
        },
      });

      fireEvent.click(screen.getByRole('button', { name: /Confirm Schedule/i }));

      // Verify normalized error appears INSIDE the scheduling dialog
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Facilitator Dr. K. Srinivas is already booked at this time.');
      });

      // Verify dialog is STILL open
      expect(screen.getByRole('heading', { name: 'Schedule Workshop' })).toBeTruthy();

      // Verify entered values are PRESERVED for retry
      expect(venueInput.value).toBe('College Main Hall');
      expect(facilitatorInput.value).toBe('Dr. K. Srinivas');
      expect(notesInput.value).toBe('Kannada speaker requested');

      // 2. Retry: Correct facilitator and submit again with success
      fireEvent.change(facilitatorInput, { target: { value: 'Prof. M. Patil' } });

      const scheduledUpdated = {
        ...mockRequest1,
        status: 'SCHEDULED',
        schedule: {
          id: 'sch-new',
          scheduled_start: '2026-10-15T10:30:00.000Z',
          duration_minutes: 90,
          mode: 'offline',
          venue_or_meeting_link: 'College Main Hall',
          assigned_facilitator: 'Prof. M. Patil',
          internal_notes: 'Kannada speaker requested',
        },
      };
      apiClient.scheduleWorkshopApi.mockResolvedValueOnce(scheduledUpdated);

      fireEvent.click(screen.getByRole('button', { name: /Confirm Schedule/i }));

      // Await modal closing and drawer / list async updates
      await waitFor(() => {
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.queryByRole('heading', { name: 'Schedule Workshop' })).toBeNull();
        expect(screen.getByText('No requests found')).toBeTruthy();
      });

      // Verify drawer data is kept current (shows SCHEDULED status and Confirmed Workshop Schedule)
      expect(screen.getByText('Confirmed Workshop Schedule')).toBeTruthy();
      expect(screen.getByText('College Main Hall')).toBeTruthy();
      expect(screen.getByText('Prof. M. Patil')).toBeTruthy();

      // Verify the list is reconciled with its active filter (statusFilter = 'NEW'):
      // Because status is now 'SCHEDULED', it should be removed from the 'NEW' table list!
      expect(screen.queryByRole('table')).toBeNull();
    });
  });

  describe('Cancellation recovery and error handling', () => {
    it('shows normalized error inside cancel dialog, preserves reason, and reconciles list on retry success', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1]);

      render(
        <MemoryRouter initialEntries={['/admin/requests?status=NEW']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt PU College Dharwad')).toBeTruthy();
      });

      // Open drawer
      const openBtn = screen.getByRole('button', { name: /Open/i });
      fireEvent.click(openBtn);

      await waitFor(() => {
        expect(screen.getByText('Coordinator Information')).toBeTruthy();
      });

      // Click Cancel in drawer footer
      const cancelBtn = screen.getByRole('button', { name: /^Cancel$/i });
      fireEvent.click(cancelBtn);

      // Verify cancel modal opened
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Cancel Workshop Request' })).toBeTruthy();
      });

      const reasonInput = screen.getByLabelText(/Reason for Cancellation/i);
      fireEvent.change(reasonInput, {
        target: { value: 'Principal requested deferral to next semester.' },
      });

      // 1. Simulate cancellation failure
      apiClient.cancelWorkshopApi.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Database lock conflict during cancellation.',
          },
        },
      });

      const confirmBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
      fireEvent.click(confirmBtn);

      // Verify normalized error appears INSIDE the cancel dialog
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Database lock conflict during cancellation.');
      });

      // Verify dialog is STILL open
      expect(screen.getByRole('heading', { name: 'Cancel Workshop Request' })).toBeTruthy();

      // Verify entered reason is PRESERVED
      expect(reasonInput.value).toBe('Principal requested deferral to next semester.');

      // 2. Retry with success
      const cancelledUpdated = {
        ...mockRequest1,
        status: 'CANCELLED',
        cancellation_reason: 'Principal requested deferral to next semester.',
        cancelled_at: '2026-09-08T12:00:00Z',
      };
      apiClient.cancelWorkshopApi.mockResolvedValueOnce(cancelledUpdated);

      fireEvent.click(confirmBtn);

      // Modal closes and list updates
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Cancel Workshop Request' })).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByText('No requests found')).toBeTruthy();
      });

      // Drawer shows cancelled status
      expect(screen.getByText('Cancellation Record')).toBeTruthy();
      expect(screen.getByText('Principal requested deferral to next semester.')).toBeTruthy();
      expect(screen.queryByRole('table')).toBeNull();
    });

    it('clears stale cancellation errors when opening another request', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest1, mockRequest2]);

      render(
        <MemoryRouter initialEntries={['/admin/requests']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt PU College Dharwad')).toBeTruthy();
      });

      // Open drawer for mockRequest1
      const openButtons = screen.getAllByRole('button', { name: /Open/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Coordinator Information')).toBeTruthy();
      });

      // Open cancel modal and fail
      fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Cancel Workshop Request' })).toBeTruthy();
      });

      const reasonInput = screen.getByLabelText(/Reason for Cancellation/i);
      fireEvent.change(reasonInput, { target: { value: 'Request 1 cancel reason' } });

      apiClient.cancelWorkshopApi.mockRejectedValueOnce({
        response: {
          data: { detail: 'Temporary failure for request 1.' },
        },
      });

      fireEvent.click(screen.getByRole('button', { name: /Confirm Cancellation/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert').textContent).toContain('Temporary failure for request 1.');
      });

      // Close cancel modal and close drawer
      fireEvent.click(screen.getByRole('button', { name: /close cancel modal/i }));
      fireEvent.click(screen.getByRole('button', { name: /close drawer/i }));

      await waitFor(() => {
        expect(screen.queryByText('Coordinator Information')).toBeNull();
      });

      // Open drawer for mockRequest2
      const updatedOpenButtons = screen.getAllByRole('button', { name: /Open/i });
      fireEvent.click(updatedOpenButtons[1]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'St Joseph School Belagavi' })).toBeTruthy();
      });

      // Open cancel modal for mockRequest2
      fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Cancel Workshop Request' })).toBeTruthy();
      });

      // Stale cancellation error and stale reason must be cleared
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByLabelText(/Reason for Cancellation/i).value).toBe('');
    });
  });

  describe('Workshop completion, validation, and error recovery', () => {
    it('starts completion fields blank, validates invalid inputs, and preserves optional blank API contract as null', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest2]);

      render(
        <MemoryRouter initialEntries={['/admin/requests']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('St Joseph School Belagavi')).toBeTruthy();
      });

      // Open drawer for scheduled request
      fireEvent.click(screen.getByRole('button', { name: /Open/i }));

      await waitFor(() => {
        expect(screen.getByText('Confirmed Workshop Schedule')).toBeTruthy();
      });

      // Click "Mark Completed" in drawer footer
      fireEvent.click(screen.getByRole('button', { name: /Mark Completed/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Complete Workshop' })).toBeTruthy();
      });

      // 1. Verify inputs start BLANK (not prefilled with student_count 85)
      const attInput = screen.getByLabelText(/Actual Student Attendance/i);
      const feedbackInput = screen.getByLabelText(/Overall Feedback Score/i);
      const notesInput = screen.getByLabelText(/Completion Notes \/ Session Highlights/i);

      expect(attInput.value).toBe('');
      expect(feedbackInput.value).toBe('');
      expect(notesInput.value).toBe('');

      // 2. Validate invalid attendance: negative integer
      fireEvent.change(attInput, { target: { value: '-5' } });
      const submitBtn = within(screen.getByRole('dialog')).getByRole('button', { name: /Mark Completed/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert').textContent).toContain('Actual attendance must be a non-negative whole number.');
      });
      // Dialog remains open
      expect(screen.getByRole('heading', { name: 'Complete Workshop' })).toBeTruthy();

      // 3. Validate invalid feedback: greater than 5
      fireEvent.change(attInput, { target: { value: '80' } });
      fireEvent.change(feedbackInput, { target: { value: '5.5' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert').textContent).toContain('Feedback score must be between 0 and 5.');
      });

      // 4. Validate blank optional contract: blank submits null for attendance and feedback
      fireEvent.change(attInput, { target: { value: '' } });
      fireEvent.change(feedbackInput, { target: { value: '' } });

      const completedNull = {
        ...mockRequest2,
        status: 'COMPLETED',
        schedule: {
          ...mockRequest2.schedule,
          actual_attendance: null,
          feedback_score: null,
          completion_notes: null,
        },
      };
      apiClient.completeWorkshopApi.mockResolvedValueOnce(completedNull);

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Complete Workshop' })).toBeNull();
      });

      expect(apiClient.completeWorkshopApi).toHaveBeenCalledWith('req-2', {
        actual_attendance: null,
        feedback_score: null,
        completion_notes: null,
      });

      // Drawer updates with audit dashes
      expect(screen.getByText('Delivered Session Audit')).toBeTruthy();
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('shows normalized error inside complete dialog, preserves explicit 0 inputs on failure, and updates drawer/list on retry', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest2]);

      render(
        <MemoryRouter initialEntries={['/admin/requests?status=SCHEDULED']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('St Joseph School Belagavi')).toBeTruthy();
      });

      // Open drawer
      fireEvent.click(screen.getByRole('button', { name: /Open/i }));

      await waitFor(() => {
        expect(screen.getByText('Confirmed Workshop Schedule')).toBeTruthy();
      });

      // Open complete modal
      fireEvent.click(screen.getByRole('button', { name: /Mark Completed/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Complete Workshop' })).toBeTruthy();
      });

      const attInput = screen.getByLabelText(/Actual Student Attendance/i);
      const feedbackInput = screen.getByLabelText(/Overall Feedback Score/i);
      const notesInput = screen.getByLabelText(/Completion Notes \/ Session Highlights/i);

      // Enter explicit 0 for attendance and feedback
      fireEvent.change(attInput, { target: { value: '0' } });
      fireEvent.change(feedbackInput, { target: { value: '0' } });
      fireEvent.change(notesInput, { target: { value: 'Zero turnout due to heavy rain' } });

      // 1. Simulate failure
      apiClient.completeWorkshopApi.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Failed to record completion due to server deadlock.',
          },
        },
      });

      const submitBtn = within(screen.getByRole('dialog')).getByRole('button', { name: /Mark Completed/i });
      fireEvent.click(submitBtn);

      // Verify normalized error appears INSIDE the active dialog
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Failed to record completion due to server deadlock.');
      });

      // Verify dialog is STILL open
      expect(screen.getByRole('heading', { name: 'Complete Workshop' })).toBeTruthy();

      // Verify explicit 0 values are preserved for retry
      expect(attInput.value).toBe('0');
      expect(feedbackInput.value).toBe('0');
      expect(notesInput.value).toBe('Zero turnout due to heavy rain');

      // 2. Retry with success
      const completedZero = {
        ...mockRequest2,
        status: 'COMPLETED',
        schedule: {
          ...mockRequest2.schedule,
          actual_attendance: 0,
          feedback_score: 0,
          completion_notes: 'Zero turnout due to heavy rain',
        },
      };
      apiClient.completeWorkshopApi.mockResolvedValueOnce(completedZero);

      fireEvent.click(submitBtn);

      // Await modal close and updates
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Complete Workshop' })).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByText('No requests found')).toBeTruthy();
      });

      // API was called with explicit numeric 0
      expect(apiClient.completeWorkshopApi).toHaveBeenCalledWith('req-2', {
        actual_attendance: 0,
        feedback_score: 0,
        completion_notes: 'Zero turnout due to heavy rain',
      });

      // In drawer: zero attendance displays "0 Students" and feedback score displays "0 / 5.0" (NOT '—')
      expect(screen.getByText('Delivered Session Audit')).toBeTruthy();
      expect(screen.getByText('0 Students')).toBeTruthy();
      expect(screen.getByText('0 / 5.0')).toBeTruthy();
      expect(screen.getByText('"Zero turnout due to heavy rain"')).toBeTruthy();

      // In list: filtered out because active statusFilter is 'SCHEDULED'
      expect(screen.queryByRole('table')).toBeNull();
    });

    it('resets completion form to blank and clears stale completeError when switching requests', async () => {
      const mockScheduledAnother = {
        ...mockRequest3,
        id: 'req-3-sched',
        status: 'SCHEDULED',
        schedule: {
          id: 'sch-3',
          scheduled_start: '2026-12-10T11:00:00.000Z',
          duration_minutes: 90,
          mode: 'offline',
          venue_or_meeting_link: 'Main Auditorium',
          assigned_facilitator: 'Dr. Ramesh',
        },
      };
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockRequest2, mockScheduledAnother]);

      render(
        <MemoryRouter initialEntries={['/admin/requests']}>
          <AdminRequestsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('St Joseph School Belagavi')).toBeTruthy();
        expect(screen.getByText('National High School Bangalore')).toBeTruthy();
      });

      // Open drawer for request 1
      const openButtons = screen.getAllByRole('button', { name: /Open/i });
      fireEvent.click(openButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'St Joseph School Belagavi' })).toBeTruthy();
      });

      // Open complete modal and cause error
      fireEvent.click(screen.getByRole('button', { name: /Mark Completed/i }));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Complete Workshop' })).toBeTruthy();
      });

      fireEvent.change(screen.getByLabelText(/Actual Student Attendance/i), { target: { value: '99' } });

      apiClient.completeWorkshopApi.mockRejectedValueOnce({
        response: { data: { detail: 'Cannot complete workshop 1.' } },
      });

      const submitBtn = within(screen.getByRole('dialog')).getByRole('button', { name: /Mark Completed/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert').textContent).toContain('Cannot complete workshop 1.');
      });

      // Close complete modal and close drawer
      fireEvent.click(screen.getByRole('button', { name: /close complete modal/i }));
      fireEvent.click(screen.getByRole('button', { name: /close drawer/i }));

      await waitFor(() => {
        expect(screen.queryByText('Confirmed Workshop Schedule')).toBeNull();
      });

      // Open drawer for request 2
      const updatedOpenButtons = screen.getAllByRole('button', { name: /Open/i });
      fireEvent.click(updatedOpenButtons[1]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'National High School Bangalore' })).toBeTruthy();
      });

      // Open complete modal for request 2
      fireEvent.click(screen.getByRole('button', { name: /Mark Completed/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Complete Workshop' })).toBeTruthy();
      });

      // Verify stale error is cleared and attendance input is reset to blank
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByLabelText(/Actual Student Attendance/i).value).toBe('');
      expect(screen.getByLabelText(/Overall Feedback Score/i).value).toBe('');
    });
  });
});
