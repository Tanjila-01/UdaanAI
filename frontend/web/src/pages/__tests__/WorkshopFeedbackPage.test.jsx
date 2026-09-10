import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WorkshopFeedbackPage from '../WorkshopFeedbackPage';
import * as apiClient from '../../api/client';

vi.mock('../../api/client', () => ({
  getWorkshopFeedbackContextApi: vi.fn(),
  submitWorkshopFeedbackApi: vi.fn(),
}));

const mockContext = {
  institution_name: 'Government Model PU College, Dharwad',
  preferred_topics: ['polytechnic_vs_puc'],
  mode: 'offline',
  completed_at: '2026-10-10T11:00:00Z',
  already_submitted: false,
  submitted_at: null,
};

describe('WorkshopFeedbackPage Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders minimal workshop context and does not expose private coordinator contact info', async () => {
    apiClient.getWorkshopFeedbackContextApi.mockResolvedValue(mockContext);

    render(
      <MemoryRouter initialEntries={['/workshops/feedback/valid-token-123']}>
        <Routes>
          <Route path="/workshops/feedback/:token" element={<WorkshopFeedbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Government Model PU College, Dharwad')).toBeTruthy();
      expect(screen.getByText(/Polytechnic Diploma vs PUC Science Deep Dive/i)).toBeTruthy();
    });

    // Check header and label
    expect(screen.getByText('Coordinator Feedback via Shared Link:')).toBeTruthy();

    // Verify contact info is nowhere in document
    expect(screen.queryByText(/Dr\. Ramesh/i)).toBeNull();
    expect(screen.queryByText(/9988776655/)).toBeNull();
    expect(screen.queryByText(/@school\.edu/i)).toBeNull();
  });

  it('handles invalid token with clear error state', async () => {
    apiClient.getWorkshopFeedbackContextApi.mockRejectedValue({
      response: {
        status: 404,
        data: { detail: 'Invalid or expired feedback link.' },
      },
    });

    render(
      <MemoryRouter initialEntries={['/workshops/feedback/invalid-token']}>
        <Routes>
          <Route path="/workshops/feedback/:token" element={<WorkshopFeedbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Invalid Feedback Link')).toBeTruthy();
      expect(screen.getByText('Invalid or expired feedback link.')).toBeTruthy();
      expect(screen.getByText(/Return to Homepage/i)).toBeTruthy();
    });
  });

  it('displays already submitted thank-you card if feedback was already recorded', async () => {
    apiClient.getWorkshopFeedbackContextApi.mockResolvedValue({
      ...mockContext,
      already_submitted: true,
      submitted_at: '2026-10-10T12:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/workshops/feedback/already-submitted-token']}>
        <Routes>
          <Route path="/workshops/feedback/:token" element={<WorkshopFeedbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Thank You for Your Feedback!')).toBeTruthy();
    });
    expect(screen.queryByRole('button', { name: /Submit Feedback/i })).toBeNull();
  });

  it('validates required rating before submission', async () => {
    apiClient.getWorkshopFeedbackContextApi.mockResolvedValue(mockContext);

    render(
      <MemoryRouter initialEntries={['/workshops/feedback/valid-token-123']}>
        <Routes>
          <Route path="/workshops/feedback/:token" element={<WorkshopFeedbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Government Model PU College, Dharwad')).toBeTruthy();
    });

    const submitBtn = screen.getByRole('button', { name: /Submit Feedback/i });
    expect(submitBtn.disabled).toBe(true);

    // Select 5 stars
    const star5Btn = screen.getByRole('button', { name: 'Rate 5 stars' });
    fireEvent.click(star5Btn);

    expect(screen.getByText('5 — Excellent')).toBeTruthy();
    expect(submitBtn.disabled).toBe(false);
  });

  it('successfully submits coordinator feedback and shows thank you state', async () => {
    apiClient.getWorkshopFeedbackContextApi.mockResolvedValue(mockContext);
    apiClient.submitWorkshopFeedbackApi.mockResolvedValue({
      message: 'Thank you! Your feedback has been recorded.',
      rating: 5,
      submitted_at: '2026-10-10T13:00:00Z',
    });

    render(
      <MemoryRouter initialEntries={['/workshops/feedback/valid-token-123']}>
        <Routes>
          <Route path="/workshops/feedback/:token" element={<WorkshopFeedbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Government Model PU College, Dharwad')).toBeTruthy();
    });

    // Rate 5 stars
    fireEvent.click(screen.getByRole('button', { name: 'Rate 5 stars' }));

    // Add comments
    const commentsInput = screen.getByLabelText(/Comments & Suggestions/i);
    fireEvent.change(commentsInput, { target: { value: 'Great session on technical education!' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));

    await waitFor(() => {
      expect(apiClient.submitWorkshopFeedbackApi).toHaveBeenCalledWith('valid-token-123', {
        rating: 5,
        comments: 'Great session on technical education!',
      });
      expect(screen.getByText('Thank You for Your Feedback!')).toBeTruthy();
    });
  });

  it('handles duplicate submission conflict (409) with clear error', async () => {
    apiClient.getWorkshopFeedbackContextApi.mockResolvedValue(mockContext);
    apiClient.submitWorkshopFeedbackApi.mockRejectedValue({
      response: {
        status: 409,
        data: { detail: 'Feedback has already been submitted for this workshop.' },
      },
    });

    render(
      <MemoryRouter initialEntries={['/workshops/feedback/valid-token-123']}>
        <Routes>
          <Route path="/workshops/feedback/:token" element={<WorkshopFeedbackPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Government Model PU College, Dharwad')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Rate 4 stars' }));
    fireEvent.click(screen.getByRole('button', { name: /Submit Feedback/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Feedback has already been submitted for this workshop.');
    });
  });
});
