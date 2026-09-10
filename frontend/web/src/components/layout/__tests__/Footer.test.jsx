import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Footer from '../Footer';
import HomePage from '../../../pages/HomePage';
import * as authContext from '../../../context/AuthContext';
import * as apiClient from '../../../api/client';

// Mock API client
vi.mock('../../../api/client', () => ({
  getPathwaysApi: vi.fn(),
  getPathwayDetailApi: vi.fn(),
  getLatestRecommendationsApi: vi.fn(),
  createStudentGoalApi: vi.fn(),
  getMyProfileApi: vi.fn(),
  submitWorkshopRequestApi: vi.fn(),
  getAdminWorkshopOverviewApi: vi.fn(),
}));

// Mock AuthContext
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Footer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Destinations, Clean Layout & Dead Anchor Removal', () => {
    it('renders accurate brand copy, accessible home link, and removes unsupported claims / physical address', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      // Home link
      const homeLink = screen.getByRole('link', { name: /Udaan AI Home/i });
      expect(homeLink.getAttribute('href')).toBe('/');

      // Accurate brand copy
      expect(
        screen.getByText(
          'Helping Karnataka students explore education options, understand their interests, and plan their next steps.'
        )
      ).toBeTruthy();

      // No unsupported claims or unverified office address
      expect(screen.queryByText(/AI-powered/i)).toBeNull();
      expect(screen.queryByText(/verified education routes/i)).toBeNull();
      expect(screen.queryByText(/Bengaluru, Karnataka/i)).toBeNull();
    });

    it('renders exactly three navigation groups: Explore, For Institutions, Account', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Explore', level: 3 })).toBeTruthy();
      expect(screen.getByRole('heading', { name: 'For Institutions', level: 3 })).toBeTruthy();
      expect(screen.getByRole('heading', { name: 'Account', level: 3 })).toBeTruthy();

      // Trust & Governance column must be completely removed
      expect(screen.queryByText(/Trust & Governance/i)).toBeNull();
      expect(screen.queryByText(/For Students/i)).toBeNull();
    });

    it('has genuine, non-duplicated destinations and completely eliminates dead policy/support/roadmap anchors', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      // Explore links
      const howItWorksLink = screen.getByRole('link', { name: 'How It Works' });
      expect(howItWorksLink.getAttribute('href')).toBe('/#how-it-works');

      const pathwaysLinks = screen.getAllByRole('link', { name: 'Explore Pathways' });
      expect(pathwaysLinks.length).toBe(1); // exactly once in the footer
      expect(pathwaysLinks[0].getAttribute('href')).toBe('/#pathways');

      const workshopsLink = screen.getByRole('link', { name: 'Workshop Topics' });
      expect(workshopsLink.getAttribute('href')).toBe('/#workshops');

      // Institutions links/buttons
      const schoolLink = screen.getByRole('link', { name: 'For Schools & Colleges' });
      expect(schoolLink.getAttribute('href')).toBe('/#school-invitation');

      const workshopButton = screen.getByRole('button', { name: 'Request a Workshop' });
      expect(workshopButton).toBeTruthy();

      // Dead anchors must not exist anywhere in footer
      expect(screen.queryByText('Career Exploration')).toBeNull();
      expect(screen.queryByText('Career Roadmap')).toBeNull();
      expect(screen.queryByText('Privacy Policy')).toBeNull();
      expect(screen.queryByText('Terms of Service')).toBeNull();
      expect(screen.queryByText('Support')).toBeNull();
      expect(screen.queryByText('Help & Support')).toBeNull();
    });

    it('verifies touch target size class (min-h-[44px]) for touch accessibility', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      const howItWorksLink = screen.getByRole('link', { name: 'How It Works' });
      expect(howItWorksLink.className).toContain('min-h-[44px]');

      const workshopButton = screen.getByRole('button', { name: 'Request a Workshop' });
      expect(workshopButton.className).toContain('min-h-[44px]');
    });
  });

  describe('2. Account Session States & Route Restrictions', () => {
    it('shows loading indicator while auth is initializing without flashing guest actions', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: true,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('Checking session...')).toBeTruthy();
      expect(screen.queryByText('Create Free Account')).toBeNull();
      expect(screen.queryByText('Sign In')).toBeNull();
      expect(screen.queryByText('Student Login')).toBeNull();
    });

    it('shows "Create Free Account" and "Sign In" for guest users', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      const registerLink = screen.getByRole('link', { name: 'Create Free Account' });
      expect(registerLink.getAttribute('href')).toBe('/register');

      const signInLink = screen.getByRole('link', { name: 'Sign In' });
      expect(signInLink.getAttribute('href')).toBe('/login');
    });

    it('shows "Complete Your Profile" (/onboarding) for incomplete student and no login/registration prompts', () => {
      authContext.useAuth.mockReturnValue({
        user: { id: 's1', role: 'student' },
        profile: { is_complete: false },
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      const onboardingLink = screen.getByRole('link', { name: 'Complete Your Profile' });
      expect(onboardingLink.getAttribute('href')).toBe('/onboarding');

      // No login or registration prompts for logged-in user
      expect(screen.queryByText('Create Free Account')).toBeNull();
      expect(screen.queryByText('Sign In')).toBeNull();
      expect(screen.queryByText('Student Login')).toBeNull();
    });

    it('shows "Go to Dashboard" (/dashboard) for complete student and no login/registration prompts', () => {
      authContext.useAuth.mockReturnValue({
        user: { id: 's2', role: 'student' },
        profile: { is_complete: true },
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByRole('link', { name: 'Go to Dashboard' });
      expect(dashboardLink.getAttribute('href')).toBe('/dashboard');

      expect(screen.queryByText('Create Free Account')).toBeNull();
      expect(screen.queryByText('Sign In')).toBeNull();
    });

    it('shows "Admin Dashboard" (/admin) for admin user and no student login/registration prompts', () => {
      authContext.useAuth.mockReturnValue({
        user: { id: 'a1', role: 'admin' },
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      const adminLink = screen.getByRole('link', { name: 'Admin Dashboard' });
      expect(adminLink.getAttribute('href')).toBe('/admin');

      expect(screen.queryByText('Create Free Account')).toBeNull();
      expect(screen.queryByText('Sign In')).toBeNull();
    });
  });

  describe('3. Workshop Integration & Single Active Modal', () => {
    it('calls onRequestWorkshop callback on HomePage and does not mount duplicate fallback modal', () => {
      const onRequestWorkshop = vi.fn();
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer onRequestWorkshop={onRequestWorkshop} />
        </MemoryRouter>
      );

      const workshopButton = screen.getByRole('button', { name: 'Request a Workshop' });
      fireEvent.click(workshopButton);

      expect(onRequestWorkshop).toHaveBeenCalledTimes(1);

      // Verify no modal is rendered inside Footer when onRequestWorkshop is provided
      expect(screen.queryByText('Request an Institutional Workshop')).toBeNull();
    });

    it('opens reusable WorkshopRequestModal standalone when used outside HomePage without submitting', async () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/design-system']}>
          <Footer />
        </MemoryRouter>
      );

      // Initially no modal
      expect(screen.queryByText('Request an Institutional Workshop')).toBeNull();

      const workshopButton = screen.getByRole('button', { name: 'Request a Workshop' });
      fireEvent.click(workshopButton);

      // Standalone modal opens cleanly
      expect(await screen.findByText('Request an Institutional Workshop')).toBeTruthy();
      expect(
        screen.getByText(/Submitting this form requests an educational workshop/i)
      ).toBeTruthy();

      // Ensure opening DID NOT submit the form
      expect(apiClient.submitWorkshopRequestApi).not.toHaveBeenCalled();

      // Close modal
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Request an Institutional Workshop')).toBeNull();
      });
    });

    it('HomePage renders exactly one WorkshopRequestModal when triggered from Footer', async () => {
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

      // Find the footer's Request a Workshop button (inside footer)
      const footer = screen.getByRole('contentinfo');
      const footerWorkshopBtn = within(footer).getByRole('button', { name: 'Request a Workshop' });
      expect(footer.contains(footerWorkshopBtn)).toBe(true);

      fireEvent.click(footerWorkshopBtn);

      // Modal appears
      const modalTitles = await screen.findAllByText('Request an Institutional Workshop');
      // Exactly one modal title rendered in document
      expect(modalTitles.length).toBe(1);

      // No submit call
      expect(apiClient.submitWorkshopRequestApi).not.toHaveBeenCalled();
    });

    it('makes WorkshopRequestModal keyboard-accessible: labelled dialog semantics, focus moved inside, Tab trap, Escape key, and focus restoration', async () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/design-system']}>
          <Footer />
        </MemoryRouter>
      );

      const workshopBtn = screen.getByRole('button', { name: 'Request a Workshop' });
      workshopBtn.focus();
      expect(document.activeElement).toBe(workshopBtn);

      fireEvent.click(workshopBtn);

      // Labelled dialog semantics
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeTruthy();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('workshop-modal-title');
      expect(dialog.getAttribute('aria-describedby')).toBe('workshop-modal-desc');

      // Focus moved inside dialog
      await waitFor(() => {
        expect(dialog.contains(document.activeElement)).toBe(true);
      });

      // Escape key handling closes dialog and restores focus to triggering button
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
      await waitFor(() => {
        expect(document.activeElement).toBe(workshopBtn);
      });
    });
  });

  describe('4. Anchor Scrolling, History & Link Behavior', () => {
    it('scrolls into view smoothly on same-page anchor click and updates React Router location without window.history.pushState', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      const targetDiv = document.createElement('div');
      targetDiv.id = 'pathways';
      document.body.appendChild(targetDiv);

      const pushStateSpy = vi.spyOn(window.history, 'pushState');

      const LocationTracker = () => {
        const location = useLocation();
        return <div data-testid="router-location">{location.pathname}{location.hash}</div>;
      };

      render(
        <MemoryRouter initialEntries={['/']}>
          <LocationTracker />
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByTestId('router-location').textContent).toBe('/');

      const pathwaysLink = screen.getByRole('link', { name: 'Explore Pathways' });
      fireEvent.click(pathwaysLink);

      // React Router location updated to /#pathways
      expect(screen.getByTestId('router-location').textContent).toBe('/#pathways');

      // Scrolled to target
      expect(targetDiv.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

      // No direct window.history.pushState call was made
      expect(pushStateSpy).not.toHaveBeenCalled();

      // Test repeated click: router location remains /#pathways, still scrolls into view cleanly
      fireEvent.click(pathwaysLink);
      expect(screen.getByTestId('router-location').textContent).toBe('/#pathways');
      expect(targetDiv.scrollIntoView).toHaveBeenCalledTimes(2);

      document.body.removeChild(targetDiv);
      pushStateSpy.mockRestore();
    });

    it('preserves native browser behavior when modifier keys are used (Ctrl, Cmd, Shift, Alt)', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      const targetDiv = document.createElement('div');
      targetDiv.id = 'how-it-works';
      document.body.appendChild(targetDiv);

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      const howItWorksLink = screen.getByRole('link', { name: 'How It Works' });

      // Click with ctrlKey (open in new tab)
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      howItWorksLink.dispatchEvent(event);

      // default action must NOT be prevented for modifier click
      expect(preventDefaultSpy).not.toHaveBeenCalled();

      document.body.removeChild(targetDiv);
    });

    it('respects prefers-reduced-motion: reduce', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      const targetDiv = document.createElement('div');
      targetDiv.id = 'workshops';
      document.body.appendChild(targetDiv);

      // Mock matchMedia for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <MemoryRouter initialEntries={['/']}>
          <Footer />
        </MemoryRouter>
      );

      const workshopsLink = screen.getByRole('link', { name: 'Workshop Topics' });
      fireEvent.click(workshopsLink);

      expect(targetDiv.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });

      document.body.removeChild(targetDiv);
    });

    it('navigates cleanly across pages from another route to homepage section', async () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/other-page']}>
          <Routes>
            <Route path="/other-page" element={<Footer />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </MemoryRouter>
      );

      const howItWorksLink = screen.getByRole('link', { name: 'How It Works' });
      expect(howItWorksLink.getAttribute('href')).toBe('/#how-it-works');

      // Click link on /other-page
      fireEvent.click(howItWorksLink);

      // HomePage renders
      expect(await screen.findByText('From Self-Discovery to Career Direction')).toBeTruthy();
    });

    it('creates distinct history entries in React Router for anchor navigation', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        logout: vi.fn(),
      });

      const pathwaysDiv = document.createElement('div');
      pathwaysDiv.id = 'pathways';
      document.body.appendChild(pathwaysDiv);

      const workshopsDiv = document.createElement('div');
      workshopsDiv.id = 'workshops';
      document.body.appendChild(workshopsDiv);

      const LocationTracker = () => {
        const location = useLocation();
        return <div data-testid="history-location">{location.pathname}{location.hash}</div>;
      };

      render(
        <MemoryRouter initialEntries={['/']}>
          <LocationTracker />
          <Footer />
        </MemoryRouter>
      );

      const pathwaysLink = screen.getByRole('link', { name: 'Explore Pathways' });
      fireEvent.click(pathwaysLink);
      expect(screen.getByTestId('history-location').textContent).toBe('/#pathways');

      const workshopsLink = screen.getByRole('link', { name: 'Workshop Topics' });
      fireEvent.click(workshopsLink);
      expect(screen.getByTestId('history-location').textContent).toBe('/#workshops');

      document.body.removeChild(pathwaysDiv);
      document.body.removeChild(workshopsDiv);
    });
  });
});
