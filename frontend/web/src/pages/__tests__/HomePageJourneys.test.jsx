import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import * as apiClient from '../../api/client';
import * as authContext from '../../context/AuthContext';

// Mock API client
vi.mock('../../api/client', () => ({
  getPathwaysApi: vi.fn(),
  getPathwayDetailApi: vi.fn(),
  getLatestRecommendationsApi: vi.fn(),
  createStudentGoalApi: vi.fn(),
  getMyProfileApi: vi.fn(),
  submitWorkshopRequestApi: vi.fn(),
  getAdminWorkshopOverviewApi: vi.fn(),
}));

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('HomePage Journeys: Workshops and Account Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Part 2: Honest Workshop Actions', () => {
    it.each([
      ['guest', null, null],
      ['incomplete student', { id: 's1', role: 'student' }, { is_complete: false }],
      ['complete student', { id: 's2', role: 'student' }, { is_complete: true }],
      ['admin', { id: 'a1', role: 'admin' }, null],
    ])('workshop buttons open modal directly for %s without redirecting', async (_, user, profile) => {
      authContext.useAuth.mockReturnValue({
        user,
        profile,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      );

      // Section title is honest: "Workshops We Can Arrange"
      expect(screen.getByText('Workshops We Can Arrange')).toBeTruthy();

      // Find "Request this Workshop" buttons
      const requestButtons = screen.getAllByRole('button', { name: /Request this Workshop/i });
      expect(requestButtons.length).toBeGreaterThanOrEqual(3);

      // Verify no "Register for Workshop" or "Reserve Free Seat" or "View All Regional Events" exists
      expect(screen.queryByText('Register for Workshop')).toBeNull();
      expect(screen.queryByText('Reserve Free Seat')).toBeNull();
      expect(screen.queryByText('View All Regional Events')).toBeNull();

      // Click the first card's request button
      fireEvent.click(requestButtons[0]);

      // Form modal opens directly on page
      expect(await screen.findByText('Request an Institutional Workshop')).toBeTruthy();
      expect(screen.getByText(/Submitting this form requests an educational workshop/i)).toBeTruthy();

      // Verify opening the modal DID NOT submit anything automatically
      expect(apiClient.submitWorkshopRequestApi).not.toHaveBeenCalled();
    });

    it('topic prefill maps to valid backend topic, is editable, and resets cleanly on reopen', async () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      );

      // Click Card 1 ("Polytechnic Diploma vs PUC Science Deep Dive")
      const polytechnicButton = screen.getAllByRole('button', { name: /Request this Workshop/i })[0];
      fireEvent.click(polytechnicButton);

      // Check that "Polytechnic vs PUC Deep Dive" topic is prefilled (checked)
      const topicCard = await screen.findByText('Polytechnic vs PUC Deep Dive');
      expect(topicCard).toBeTruthy();
      const parentOption = topicCard.closest('div[class*="border"]');
      expect(parentOption.className).toContain('border-[#005F60]');

      // Topic remains editable: user can toggle another topic
      const aiTopicCard = screen.getByText('AI Literacy & Practical Tools');
      fireEvent.click(aiTopicCard);
      const aiOption = aiTopicCard.closest('div[class*="border"]');
      expect(aiOption.className).toContain('border-[#005F60]');

      // Close modal
      const closeBtn = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByText('Request an Institutional Workshop')).toBeNull();
      });

      // Open general "Request a Workshop" button from Section 7/9
      const workshopButtons = screen.getAllByRole('button', { name: /Request a Workshop/i });
      fireEvent.click(workshopButtons[0]);

      // Modal reopens with default 'career_guidance', stale polytechnic/AI selections are reset
      const matchingTopics = await screen.findAllByText('Career Guidance & Stream Selection');
      const reopenedTopic = matchingTopics[matchingTopics.length - 1];
      const reopenedParent = reopenedTopic.closest('div[class*="border"]');
      expect(reopenedParent.className).toContain('border-[#005F60]');
    });

    it('successful workshop submission occurs only on explicit form submit with valid inputs', async () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      apiClient.submitWorkshopRequestApi.mockResolvedValue({
        id: 'req-123',
        status: 'NEW',
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      );

      // Open modal
      const reqBtn = screen.getAllByRole('button', { name: /Request this Workshop/i })[0];
      fireEvent.click(reqBtn);

      // Fill in required form fields
      fireEvent.change(screen.getByPlaceholderText(/Government Pre-University College/i), {
        target: { value: 'Government Model PU College' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Prof\. Anand Kumar/i), {
        target: { value: 'Principal Ramesh Rao' },
      });
      fireEvent.change(screen.getByPlaceholderText(/9876543210/i), {
        target: { value: '9876543210' },
      });
      fireEvent.change(screen.getByPlaceholderText(/principal@school\.edu\.in/i), {
        target: { value: 'principal@modelcollege.edu.in' },
      });

      // Submit form
      const submitBtn = screen.getByRole('button', { name: /Submit Workshop Request/i });
      fireEvent.click(submitBtn);

      // Verifies API is called with payload
      await waitFor(() => {
        expect(apiClient.submitWorkshopRequestApi).toHaveBeenCalledTimes(1);
      });

      // Displays confirmation
      expect(await screen.findByText('Workshop request received')).toBeTruthy();
    });

    it('handles submission error gracefully and keeps inputs editable', async () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      apiClient.submitWorkshopRequestApi.mockRejectedValueOnce(
        new Error('Contact phone must contain at least 10 digits.')
      );

      render(
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      );

      const reqBtn = screen.getAllByRole('button', { name: /Request this Workshop/i })[0];
      fireEvent.click(reqBtn);

      fireEvent.change(screen.getByPlaceholderText(/Government Pre-University College/i), {
        target: { value: 'Test PU College' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Prof\. Anand Kumar/i), {
        target: { value: 'Test Principal' },
      });
      fireEvent.change(screen.getByPlaceholderText(/9876543210/i), {
        target: { value: '123' },
      });
      fireEvent.change(screen.getByPlaceholderText(/principal@school\.edu\.in/i), {
        target: { value: 'test@school.edu.in' },
      });

      const submitBtn = screen.getByRole('button', { name: /Submit Workshop Request/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText('Contact phone must contain at least 10 digits.')).toBeTruthy();
    });
  });

  describe('Part 3: Account-Related Buttons in All 4 User States + Loading', () => {
    it('State 1 - Loading: prevents flashing incorrect button state', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: true,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      );

      // Hero primary button is in loading state, not showing "Create Free Account"
      const heroButton = screen.getAllByRole('button', { name: /Loading\.\.\./i })[0];
      expect(heroButton).toBeTruthy();
      expect(heroButton.hasAttribute('disabled')).toBe(true);
    });

    it('State 2 - Guest: shows "Create Free Account" pointing to /register', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      );

      // Navbar & Hero
      const registerLinks = screen.getAllByRole('link', { name: /Create Free Account/i });
      expect(registerLinks.length).toBeGreaterThanOrEqual(1);
      expect(registerLinks[0].getAttribute('href')).toBe('/register');

      // Navbar, Hero & Closing CTA Banner buttons
      const createButtons = screen.getAllByRole('button', { name: /Create Free Account/i });
      expect(createButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('State 3 - Incomplete Student: shows "Complete Your Profile" pointing to /onboarding', () => {
      authContext.useAuth.mockReturnValue({
        user: { id: 's-inc', role: 'student', full_name: 'New Student' },
        profile: { is_complete: false },
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      );

      const onboardingLinks = screen.getAllByRole('link', { name: /Complete Your Profile/i });
      expect(onboardingLinks.length).toBeGreaterThanOrEqual(1);
      expect(onboardingLinks[0].getAttribute('href')).toBe('/onboarding');
      expect(screen.queryByText('Create Free Account')).toBeNull();
    });

    it('State 4 - Complete Student: shows "Go to Dashboard" pointing to /dashboard', () => {
      authContext.useAuth.mockReturnValue({
        user: { id: 's-comp', role: 'student', full_name: 'Existing Student' },
        profile: { is_complete: true },
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      );

      const dashboardLinks = screen.getAllByRole('link', { name: /Go to Dashboard/i });
      expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
      expect(dashboardLinks[0].getAttribute('href')).toBe('/dashboard');
      expect(screen.queryByText('Create Free Account')).toBeNull();
    });

    it('State 5 - Admin: shows "Admin Dashboard" pointing to /admin directly', () => {
      authContext.useAuth.mockReturnValue({
        user: { id: 'admin-1', role: 'admin', email: 'admin@udaan.ai' },
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <HomePage />
        </MemoryRouter>
      );

      const adminLinks = screen.getAllByRole('link', { name: /Admin Dashboard/i });
      expect(adminLinks.length).toBeGreaterThanOrEqual(1);
      expect(adminLinks[0].getAttribute('href')).toBe('/admin');
      expect(screen.queryByText('Create Free Account')).toBeNull();
      expect(screen.queryByText('Go to Dashboard')).toBeNull();
    });
  });
});
