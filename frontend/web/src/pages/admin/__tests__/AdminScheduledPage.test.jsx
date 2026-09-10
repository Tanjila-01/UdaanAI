import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminScheduledPage from '../AdminScheduledPage';
import * as apiClient from '../../../api/client';
import * as authContext from '../../../context/AuthContext';

vi.mock('../../../api/client', () => ({
  getAdminWorkshopRequestsApi: vi.fn(),
  completeWorkshopApi: vi.fn(),
  updateWorkshopScheduleApi: vi.fn(),
  cancelWorkshopApi: vi.fn(),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { full_name: 'Admin User', role: 'ADMIN' },
    logout: vi.fn(),
  })),
}));

const mockScheduled1 = {
  id: 'sch-req-1',
  institution_name: 'Govt Model Higher Primary School',
  institution_type: 'GOVERNMENT_SCHOOL',
  district: 'Dharwad',
  preferred_mode: 'offline',
  student_count: 150,
  schedule: {
    id: 'sch-1',
    scheduled_start: '2026-10-15T10:30:00.000Z',
    duration_minutes: 90,
    mode: 'offline',
    venue_or_meeting_link: 'Main Auditorium, Dharwad',
    assigned_facilitator: 'Dr. Ramesh Patil',
    internal_notes: 'Kannada slides',
  },
  status: 'SCHEDULED',
};

const mockScheduled2 = {
  id: 'sch-req-2',
  institution_name: 'St Paul High School',
  institution_type: 'PRIVATE_AIDED',
  district: 'Belagavi',
  preferred_mode: 'online',
  student_count: 80,
  schedule: {
    id: 'sch-2',
    scheduled_start: '2026-10-20T14:00:00.000Z',
    duration_minutes: 60,
    mode: 'online',
    venue_or_meeting_link: 'https://meet.google.com/xyz-test',
    assigned_facilitator: 'Sister Mary',
  },
  status: 'SCHEDULED',
};

const mockStartedScheduled1 = {
  ...mockScheduled1,
  schedule: {
    ...mockScheduled1.schedule,
    scheduled_start: '2026-08-15T10:30:00.000Z',
  },
};

const mockStartedScheduled2 = {
  ...mockScheduled2,
  schedule: {
    ...mockScheduled2.schedule,
    scheduled_start: '2026-08-20T14:00:00.000Z',
  },
};

describe('AdminScheduledPage Cancellation Recovery', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authContext.useAuth.mockReturnValue({
      user: { full_name: 'Admin User', role: 'ADMIN' },
      logout: vi.fn(),
    });
  });

  it('shows normalized error inside cancellation dialog, preserves reason, and reconciles list on retry success', async () => {
    apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockScheduled1]);

    render(
      <MemoryRouter initialEntries={['/admin/scheduled']}>
        <AdminScheduledPage />
      </MemoryRouter>
    );

    // Verify initial load
    await waitFor(() => {
      expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
    });

    // Open cancellation modal
    const cancelBtn = screen.getByTitle('Cancel Session');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Cancel Scheduled Workshop' })).toBeTruthy();
    });

    const reasonInput = screen.getByLabelText(/Reason for Cancellation/i);
    fireEvent.change(reasonInput, {
      target: { value: 'Facilitator sudden illness; institution agreed to postpone.' },
    });

    // 1. Simulate cancellation failure
    apiClient.cancelWorkshopApi.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Conflict: session cannot be cancelled while attendance sync is in progress.',
        },
      },
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
    fireEvent.click(confirmBtn);

    // Verify normalized error appears INSIDE the active cancellation dialog
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Conflict: session cannot be cancelled while attendance sync is in progress.');
    });

    // Dialog remains open
    expect(screen.getByRole('heading', { name: 'Cancel Scheduled Workshop' })).toBeTruthy();

    // Entered reason is PRESERVED for retry
    expect(reasonInput.value).toBe('Facilitator sudden illness; institution agreed to postpone.');

    // 2. Retry: Mock successful cancellation
    apiClient.cancelWorkshopApi.mockResolvedValueOnce({
      ...mockScheduled1,
      status: 'CANCELLED',
      cancellation_reason: 'Facilitator sudden illness; institution agreed to postpone.',
    });
    // On re-fetch, empty list because status is now CANCELLED
    apiClient.getAdminWorkshopRequestsApi.mockResolvedValueOnce([]);

    fireEvent.click(confirmBtn);

    // Dialog closes and list is updated
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Cancel Scheduled Workshop' })).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByText('No scheduled workshops')).toBeTruthy();
    });

    expect(screen.queryByText('Govt Model Higher Primary School')).toBeNull();
  });

  it('clears stale cancellation errors when opening another workshop', async () => {
    apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockScheduled1, mockScheduled2]);

    render(
      <MemoryRouter initialEntries={['/admin/scheduled']}>
        <AdminScheduledPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
      expect(screen.getByText('St Paul High School')).toBeTruthy();
    });

    // Open cancel modal for workshop 1
    const cancelButtons = screen.getAllByTitle('Cancel Session');
    fireEvent.click(cancelButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Cancel Scheduled Workshop' })).toBeTruthy();
    });

    const reasonInput = screen.getByLabelText(/Reason for Cancellation/i);
    fireEvent.change(reasonInput, { target: { value: 'Reason for workshop 1' } });

    // Simulate failure
    apiClient.cancelWorkshopApi.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Failed to cancel workshop 1.',
        },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Cancellation/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Failed to cancel workshop 1.');
    });

    // Close the cancel modal
    fireEvent.click(screen.getByRole('button', { name: /close cancel modal/i }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Cancel Scheduled Workshop' })).toBeNull();
    });

    // Open cancel modal for workshop 2
    const currentCancelButtons = screen.getAllByTitle('Cancel Session');
    fireEvent.click(currentCancelButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Cancel Scheduled Workshop' })).toBeTruthy();
    });

    // Verify stale error is cleared and reason is reset
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText(/Reason for Cancellation/i).value).toBe('');
  });

  describe('AdminScheduledPage Workshop Completion', () => {
    it('shows premature completion warning banner and disables completion submission before scheduled start time', async () => {
      // mockScheduled1 has scheduled_start in the future (October 2026)
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockScheduled1]);

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
      });

      // Click "Complete" action button
      const completeBtn = screen.getByRole('button', { name: /Complete/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Mark Workshop Completed' })).toBeTruthy();
      });

      // Verify premature warning banner is displayed and submit button is disabled
      expect(screen.getByText(/Cannot mark workshop as completed before its scheduled start time/i)).toBeTruthy();
      const submitBtn = screen.getByRole('button', { name: /Confirm Completion/i });
      expect(submitBtn.disabled).toBe(true);
    });

    it('does not prefill attendance from student_count, validates inputs, and submits null for blank optional values', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockStartedScheduled1]);

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
      });

      // Click "Complete" action button
      const completeBtn = screen.getByRole('button', { name: /Complete/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Mark Workshop Completed' })).toBeTruthy();
      });

      // 1. Verify actual attendance starts BLANK, NOT prefilled with mockStartedScheduled1.student_count (150)
      const attInput = screen.getByLabelText(/Actual Student Attendance/i);
      const feedbackInput = screen.getByLabelText(/Feedback Score/i);
      const notesInput = screen.getByLabelText(/Completion Notes/i);

      expect(attInput.value).toBe('');
      expect(feedbackInput.value).toBe('');
      expect(notesInput.value).toBe('');

      // 2. Validate invalid attendance input
      fireEvent.change(attInput, { target: { value: '-2' } });
      const submitBtn = screen.getByRole('button', { name: /Confirm Completion/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert').textContent).toContain('Actual attendance must be a non-negative whole number.');
      });
      expect(screen.getByRole('heading', { name: 'Mark Workshop Completed' })).toBeTruthy();

      // 3. Validate invalid feedback score
      fireEvent.change(attInput, { target: { value: '140' } });
      fireEvent.change(feedbackInput, { target: { value: '5.2' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('alert').textContent).toContain('Feedback score must be between 0 and 5.');
      });

      // 4. Validate blank inputs contract (submits null)
      fireEvent.change(attInput, { target: { value: '' } });
      fireEvent.change(feedbackInput, { target: { value: '' } });

      apiClient.completeWorkshopApi.mockResolvedValueOnce({
        ...mockStartedScheduled1,
        status: 'COMPLETED',
      });
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValueOnce([]);

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Mark Workshop Completed' })).toBeNull();
      });

      expect(apiClient.completeWorkshopApi).toHaveBeenCalledWith('sch-req-1', {
        actual_attendance: null,
        feedback_score: null,
        completion_notes: null,
      });
    });

    it('shows normalized error in dialog, preserves explicit 0 inputs on failure, and updates list on retry', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockStartedScheduled1]);

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
      });

      // Open complete dialog
      fireEvent.click(screen.getByRole('button', { name: /Complete/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Mark Workshop Completed' })).toBeTruthy();
      });

      const attInput = screen.getByLabelText(/Actual Student Attendance/i);
      const feedbackInput = screen.getByLabelText(/Feedback Score/i);
      const notesInput = screen.getByLabelText(/Completion Notes/i);

      // Enter explicit 0 for attendance and feedback
      fireEvent.change(attInput, { target: { value: '0' } });
      fireEvent.change(feedbackInput, { target: { value: '0' } });
      fireEvent.change(notesInput, { target: { value: 'Zero attendance recorded' } });

      // 1. Simulate completion failure
      apiClient.completeWorkshopApi.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Database transaction aborted while completing workshop.',
          },
        },
      });

      const submitBtn = screen.getByRole('button', { name: /Confirm Completion/i });
      fireEvent.click(submitBtn);

      // Verify normalized error appears INSIDE the active dialog
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Database transaction aborted while completing workshop.');
      });

      // Dialog is still open
      expect(screen.getByRole('heading', { name: 'Mark Workshop Completed' })).toBeTruthy();

      // Explicit 0 values preserved for retry
      expect(attInput.value).toBe('0');
      expect(feedbackInput.value).toBe('0');
      expect(notesInput.value).toBe('Zero attendance recorded');

      // 2. Retry with success
      apiClient.completeWorkshopApi.mockResolvedValueOnce({
        ...mockStartedScheduled1,
        status: 'COMPLETED',
        schedule: {
          ...mockStartedScheduled1.schedule,
          actual_attendance: 0,
          feedback_score: 0,
          completion_notes: 'Zero attendance recorded',
        },
      });
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValueOnce([]);

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Mark Workshop Completed' })).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByText('No scheduled workshops')).toBeTruthy();
      });

      expect(apiClient.completeWorkshopApi).toHaveBeenCalledWith('sch-req-1', {
        actual_attendance: 0,
        feedback_score: 0,
        completion_notes: 'Zero attendance recorded',
      });
      expect(screen.queryByText('Govt Model Higher Primary School')).toBeNull();
    });

    it('resets complete form and clears stale errors when switching workshops', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockStartedScheduled1, mockStartedScheduled2]);

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
        expect(screen.getByText('St Paul High School')).toBeTruthy();
      });

      // Open complete dialog for workshop 1
      const completeButtons = screen.getAllByRole('button', { name: /Complete/i });
      fireEvent.click(completeButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Mark Workshop Completed' })).toBeTruthy();
      });

      fireEvent.change(screen.getByLabelText(/Actual Student Attendance/i), { target: { value: '50' } });

      // Trigger error
      apiClient.completeWorkshopApi.mockRejectedValueOnce({
        response: {
          data: { detail: 'Complete failed for workshop 1.' },
        },
      });

      fireEvent.click(screen.getByRole('button', { name: /Confirm Completion/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert').textContent).toContain('Complete failed for workshop 1.');
      });

      // Close modal
      fireEvent.click(screen.getByRole('button', { name: /close complete modal/i }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Mark Workshop Completed' })).toBeNull();
      });

      // Open complete dialog for workshop 2
      const updatedButtons = screen.getAllByRole('button', { name: /Complete/i });
      fireEvent.click(updatedButtons[1]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Mark Workshop Completed' })).toBeTruthy();
      });

      // Verify stale error is cleared and inputs are blank
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByLabelText(/Actual Student Attendance/i).value).toBe('');
      expect(screen.getByLabelText(/Feedback Score/i).value).toBe('');
    });
  });

  describe('AdminScheduledPage Loading and Error Recovery', () => {
    it('handles initial load failure without showing empty list success message, and recovers on Retry', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Database connection failed while loading schedule.',
          },
        },
      });

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      // Verify initial error state
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Database connection failed while loading schedule.');
      });

      // Must not display "No scheduled workshops" empty success state
      expect(screen.queryByText('No scheduled workshops')).toBeNull();
      expect(screen.queryByRole('table')).toBeNull();

      // Click Retry to recover
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValueOnce([mockScheduled1]);

      const retryBtn = screen.getByRole('button', { name: /^Retry$/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
      });
    });

    it('marks retained data as stale on refresh failure, and clears stale state on successful Retry', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValueOnce([mockScheduled1]);

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
      });

      // Simulate refresh failure
      apiClient.getAdminWorkshopRequestsApi.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Temporary upstream gateway timeout.',
          },
        },
      });

      const refreshBtn = screen.getByRole('button', { name: /Refresh Schedule/i });
      fireEvent.click(refreshBtn);

      // Verify stale data banner
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Showing cached data (data may be stale).');
        expect(alert.textContent).toContain('Temporary upstream gateway timeout.');
      });

      // Retained data is still visible
      expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();

      // Retry from stale alert succeeds
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValueOnce([mockScheduled1]);

      const retryBtn = screen.getByRole('button', { name: /^Retry$/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
      });
    });
  });

  describe('AdminScheduledPage Edit Schedule Errors and Recovery', () => {
    it('shows structured normalized error inside edit dialog, preserves entered values for retry, and recovers on success', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockScheduled1]);

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
      });

      // Open edit dialog
      const editBtn = screen.getByTitle('Edit Schedule');
      fireEvent.click(editBtn);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Workshop Schedule' })).toBeTruthy();
      });

      const venueInput = screen.getByLabelText(/Venue \/ Link \*/i);
      const facilitatorInput = screen.getByLabelText(/Assigned Facilitator/i);

      expect(venueInput.value).toBe('Main Auditorium, Dharwad');
      expect(facilitatorInput.value).toBe('Dr. Ramesh Patil');

      // Update fields
      fireEvent.change(venueInput, { target: { value: 'Community Hall North' } });
      fireEvent.change(facilitatorInput, { target: { value: 'Prof. Rao' } });

      // Simulate structured Pydantic array validation error from backend
      apiClient.updateWorkshopScheduleApi.mockRejectedValueOnce({
        response: {
          data: {
            detail: [{ msg: 'Facilitator is already booked for another session.' }],
          },
        },
      });

      const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveBtn);

      // Verify normalized error appears INSIDE the active dialog
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Facilitator is already booked for another session.');
      });

      // Verify dialog is still open
      expect(screen.getByRole('heading', { name: 'Edit Workshop Schedule' })).toBeTruthy();

      // Verify entered values are preserved for retry
      expect(venueInput.value).toBe('Community Hall North');
      expect(facilitatorInput.value).toBe('Prof. Rao');

      // Retry with another facilitator
      fireEvent.change(facilitatorInput, { target: { value: 'Prof. Anita Sharma' } });

      apiClient.updateWorkshopScheduleApi.mockResolvedValueOnce({
        ...mockScheduled1,
        schedule: {
          ...mockScheduled1.schedule,
          venue_or_meeting_link: 'Community Hall North',
          assigned_facilitator: 'Prof. Anita Sharma',
        },
      });
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValueOnce([
        {
          ...mockScheduled1,
          schedule: {
            ...mockScheduled1.schedule,
            venue_or_meeting_link: 'Community Hall North',
            assigned_facilitator: 'Prof. Anita Sharma',
          },
        },
      ]);

      fireEvent.click(saveBtn);

      // Dialog closes and updated data displays
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Edit Workshop Schedule' })).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
        expect(screen.getByText('Community Hall North')).toBeTruthy();
        expect(screen.getByText('Prof. Anita Sharma')).toBeTruthy();
      });
    });

    it('resets edit form and clears stale edit error when switching workshops', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockScheduled1, mockScheduled2]);

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
        expect(screen.getByText('St Paul High School')).toBeTruthy();
      });

      // Open edit dialog for workshop 1
      const editButtons = screen.getAllByTitle('Edit Schedule');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Workshop Schedule' })).toBeTruthy();
      });

      apiClient.updateWorkshopScheduleApi.mockRejectedValueOnce({
        response: { data: { detail: 'Temporary update error for workshop 1.' } },
      });

      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert').textContent).toContain('Temporary update error for workshop 1.');
      });

      // Close edit dialog
      fireEvent.click(screen.getByRole('button', { name: /close edit modal/i }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Edit Workshop Schedule' })).toBeNull();
      });

      // Open edit dialog for workshop 2
      const updatedEditButtons = screen.getAllByTitle('Edit Schedule');
      fireEvent.click(updatedEditButtons[1]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Workshop Schedule' })).toBeTruthy();
      });

      // Stale error must be cleared and form populated with workshop 2's data
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByLabelText(/Venue \/ Link \*/i).value).toBe('https://meet.google.com/xyz-test');
    });

    it('clears optional facilitator and internal_notes when blanked, surviving reload', async () => {
      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([mockScheduled1]);

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Govt Model Higher Primary School')).toBeTruthy();
        expect(screen.getByText('Dr. Ramesh Patil')).toBeTruthy();
      });

      // Open edit modal
      fireEvent.click(screen.getByTitle('Edit Schedule'));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Workshop Schedule' })).toBeTruthy();
      });

      expect(screen.getByLabelText(/Internal Notes/i).value).toBe('Kannada slides');

      // Clear facilitator and notes
      const facInput = screen.getByLabelText(/Assigned Facilitator/i);
      fireEvent.change(facInput, { target: { value: '' } });

      const notesInput = screen.getByLabelText(/Internal Notes/i);
      fireEvent.change(notesInput, { target: { value: '' } });

      // Mock update and refreshed get response with cleared fields
      apiClient.updateWorkshopScheduleApi.mockResolvedValueOnce({
        ...mockScheduled1,
        schedule: {
          ...mockScheduled1.schedule,
          assigned_facilitator: null,
          internal_notes: null,
        },
      });

      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([
        {
          ...mockScheduled1,
          schedule: {
            ...mockScheduled1.schedule,
            assigned_facilitator: null,
            internal_notes: null,
          },
        },
      ]);

      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Edit Workshop Schedule' })).toBeNull();
      });

      // Verify payload sent explicit nulls and omitted unchanged scheduled_start
      expect(apiClient.updateWorkshopScheduleApi).toHaveBeenCalledWith(
        'sch-req-1',
        {
          assigned_facilitator: null,
          internal_notes: null,
        }
      );

      // Verify reloading survives with cleared fields
      await waitFor(() => {
        expect(screen.queryByText('Dr. Ramesh Patil')).toBeNull();
        expect(screen.getByText('Unassigned')).toBeTruthy();
      });

      // Re-open edit dialog to verify internal_notes is cleared
      fireEvent.click(screen.getByTitle('Edit Schedule'));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Workshop Schedule' })).toBeTruthy();
      });
      expect(screen.getByLabelText(/Internal Notes/i).value).toBe('');
      expect(screen.getByLabelText(/Assigned Facilitator/i).value).toBe('');
    });

    it('allows details-only edits on overdue workshops without past-time rejection', async () => {
      const overdueWorkshop = {
        id: 'sch-overdue-1',
        institution_name: 'Historical Overdue College',
        district: 'Mysuru',
        preferred_mode: 'offline',
        status: 'SCHEDULED',
        schedule: {
          id: 'sch-overdue',
          scheduled_start: '2026-01-10T10:30:00.000Z', // In the past
          duration_minutes: 90,
          mode: 'offline',
          venue_or_meeting_link: 'Old Hall A',
          assigned_facilitator: 'Prof. Past',
        },
      };

      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([overdueWorkshop]);

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Historical Overdue College')).toBeTruthy();
      });

      // Open edit modal
      fireEvent.click(screen.getByTitle('Edit Schedule'));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Workshop Schedule' })).toBeTruthy();
      });

      // Update venue and facilitator; keep historical date/time unchanged
      const venueInput = screen.getByLabelText(/Venue \/ Link \*/i);
      fireEvent.change(venueInput, { target: { value: 'Renovated Auditorium' } });

      apiClient.updateWorkshopScheduleApi.mockResolvedValueOnce({
        ...overdueWorkshop,
        schedule: {
          ...overdueWorkshop.schedule,
          venue_or_meeting_link: 'Renovated Auditorium',
        },
      });

      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([
        {
          ...overdueWorkshop,
          schedule: {
            ...overdueWorkshop.schedule,
            venue_or_meeting_link: 'Renovated Auditorium',
          },
        },
      ]);

      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

      // Succeeded without 'cannot be in the past' error
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Edit Workshop Schedule' })).toBeNull();
      });

      // scheduled_start was omitted from payload, preserving historical start
      expect(apiClient.updateWorkshopScheduleApi).toHaveBeenCalledWith(
        'sch-overdue-1',
        {
          venue_or_meeting_link: 'Renovated Auditorium',
        }
      );
    });

    it('rejects past start time when admin actively modifies date/time of overdue workshop', async () => {
      const overdueWorkshop = {
        id: 'sch-overdue-2',
        institution_name: 'Historical Overdue College 2',
        district: 'Mysuru',
        preferred_mode: 'offline',
        status: 'SCHEDULED',
        schedule: {
          id: 'sch-overdue-2',
          scheduled_start: '2026-01-10T10:30:00.000Z',
          duration_minutes: 90,
          mode: 'offline',
          venue_or_meeting_link: 'Old Hall A',
        },
      };

      apiClient.getAdminWorkshopRequestsApi.mockResolvedValue([overdueWorkshop]);

      render(
        <MemoryRouter initialEntries={['/admin/scheduled']}>
          <AdminScheduledPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Historical Overdue College 2')).toBeTruthy();
      });

      fireEvent.click(screen.getByTitle('Edit Schedule'));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Edit Workshop Schedule' })).toBeTruthy();
      });

      // Change date to another past date
      const dateInput = screen.getByLabelText(/Date \*/i);
      fireEvent.change(dateInput, { target: { value: '2026-02-01' } });

      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

      // Client-side validation triggers
      await waitFor(() => {
        expect(screen.getByRole('alert').textContent).toContain('Workshop scheduled start time cannot be in the past.');
      });
      expect(apiClient.updateWorkshopScheduleApi).not.toHaveBeenCalled();
    });
  });
});
