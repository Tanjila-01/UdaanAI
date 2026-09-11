import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import LoginPage from '../LoginPage';
import AdminLoginPage from '../admin/AdminLoginPage';
import OnboardingPage from '../OnboardingPage';
import AssessmentPage from '../AssessmentPage';
import DashboardPage from '../DashboardPage';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AdminRoute } from '../../components/AdminRoute';
import * as apiClient from '../../api/client';
import * as authContext from '../../context/AuthContext';
import * as sidebarContext from '../../context/SidebarContext';

vi.mock('../../api/client', () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  getCurrentUserApi: vi.fn(),
  getMyProfileApi: vi.fn(),
  logoutApi: vi.fn(),
  createProfileApi: vi.fn(),
  getMyAssignedAssessmentApi: vi.fn(),
  getAssessmentsApi: vi.fn(),
  getAssessmentDetailApi: vi.fn(),
  getAttemptDetailApi: vi.fn(),
  startAssessmentAttemptApi: vi.fn(),
  submitAssessmentAnswerApi: vi.fn(),
  completeAssessmentAttemptApi: vi.fn(),
  getMyLatestAssessmentResultApi: vi.fn(),
  generateRecommendationsApi: vi.fn(),
  getLatestRecommendationsApi: vi.fn(),
  getMyStudentGoalApi: vi.fn(),
  getPathwaysApi: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../../context/SidebarContext', () => ({
  useSidebar: vi.fn(() => ({ isCollapsed: false, toggleSidebar: vi.fn() })),
  SidebarProvider: ({ children }) => children,
}));

window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Location inspector helper component
const LocationInspector = () => {
  const location = useLocation();
  return (
    <div>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="search">{location.search}</span>
      <span data-testid="state-from">
        {location.state?.from?.pathname || (typeof location.state?.from === 'string' ? location.state.from : '')}
      </span>
    </div>
  );
};

describe('Student Journey: Auth, Redirects & Progress Preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Navigation & Redirect Preservation', () => {
    it('redirects completed student to target location.state.from instead of forcing onboarding', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        access_token: 'valid-token',
        user: { id: 's1', role: 'student', full_name: 'Student One' },
        profile: { id: 'p1', current_level: 'Class 10', is_complete: true },
      });

      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        login: mockLogin,
      });

      render(
        <MemoryRouter
          initialEntries={[
            { pathname: '/login', state: { from: { pathname: '/my-roadmap', search: '?tab=checklist' } } },
          ]}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/my-roadmap" element={<LocationInspector />} />
            <Route path="/onboarding" element={<LocationInspector />} />
            <Route path="/dashboard" element={<LocationInspector />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('student@example.com'), {
        target: { value: 'student@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter password'), {
        target: { value: 'Password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('student@example.com', 'Password123');
        expect(screen.getByTestId('pathname').textContent).toBe('/my-roadmap');
        expect(screen.getByTestId('search').textContent).toBe('?tab=checklist');
      });
    });

    it('redirects incomplete student to /onboarding and preserves location.state.from', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        access_token: 'valid-token',
        user: { id: 's2', role: 'student', full_name: 'Student Two' },
        profile: { id: 'p2', current_level: 'Class 10', is_complete: false },
      });

      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        login: mockLogin,
      });

      render(
        <MemoryRouter
          initialEntries={[
            { pathname: '/login', state: { from: { pathname: '/assessment', search: '?mode=take' } } },
          ]}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<LocationInspector />} />
            <Route path="/dashboard" element={<LocationInspector />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('student@example.com'), {
        target: { value: 'student2@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter password'), {
        target: { value: 'Password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
        expect(screen.getByTestId('pathname').textContent).toBe('/onboarding');
        expect(screen.getByTestId('state-from').textContent).toBe('/assessment');
      });
    });

    it('redirects admin user to /admin or location.state.from and preserves admin route protection', async () => {
      const mockLogin = vi.fn().mockResolvedValue({
        access_token: 'admin-token',
        user: { id: 'admin1', role: 'admin', full_name: 'Admin User' },
        profile: null,
      });

      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        login: mockLogin,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter
          initialEntries={[
            { pathname: '/admin/login', state: { from: { pathname: '/admin/scheduled' } } },
          ]}
        >
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/scheduled" element={<LocationInspector />} />
            <Route path="/admin" element={<LocationInspector />} />
          </Routes>
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Enter your admin email'), {
        target: { value: 'admin@udaanai.org' },
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'AdminSecret123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in to admin console/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin@udaanai.org', 'AdminSecret123');
        expect(screen.getByTestId('pathname').textContent).toBe('/admin/scheduled');
      });
    });
  });

  describe('Route Protection Boundaries', () => {
    it('redirects unauthenticated visitors attempting to access protected student routes to /login with state', () => {
      authContext.useAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/my-roadmap']}>
          <Routes>
            <Route
              path="/my-roadmap"
              element={
                <ProtectedRoute requireProfile={true}>
                  <div>Secret Roadmap</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LocationInspector />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('pathname').textContent).toBe('/login');
      expect(screen.getByTestId('state-from').textContent).toBe('/my-roadmap');
    });

    it('redirects students attempting to access admin routes to /dashboard', () => {
      authContext.useAuth.mockReturnValue({
        user: { id: 's1', role: 'student' },
        profile: { is_complete: true },
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <div>Admin Portal</div>
                </AdminRoute>
              }
            />
            <Route path="/dashboard" element={<LocationInspector />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('pathname').textContent).toBe('/dashboard');
    });
  });

  describe('Assessment Progress Restoration on Return or Reload', () => {
    it('resumes previous in-progress attempt answers and starts at the first unanswered question', async () => {
      const mockAssignedAssessment = {
        id: 'c10-discovery',
        title: 'Class 10 Discovery Assessment',
        questions: [
          {
            id: 'q1',
            question_text: 'Question 1: Do you enjoy coding?',
            options: [
              { id: 'opt1-yes', option_text: 'Yes' },
              { id: 'opt1-no', option_text: 'No' },
            ],
          },
          {
            id: 'q2',
            question_text: 'Question 2: Do you enjoy science experiments?',
            options: [
              { id: 'opt2-yes', option_text: 'Yes' },
              { id: 'opt2-no', option_text: 'No' },
            ],
          },
        ],
      };

      const mockAttempt = {
        id: 'att-123',
        assessment_id: 'c10-discovery',
        status: 'in_progress',
      };

      const mockAttemptDetail = {
        id: 'att-123',
        status: 'in_progress',
        answers: [
          { question_id: 'q1', selected_option_id: 'opt1-yes' },
        ],
      };

      apiClient.getMyLatestAssessmentResultApi.mockResolvedValue(null);
      apiClient.getMyAssignedAssessmentApi.mockResolvedValue(mockAssignedAssessment);
      apiClient.startAssessmentAttemptApi.mockResolvedValue(mockAttempt);
      apiClient.getAttemptDetailApi.mockResolvedValue(mockAttemptDetail);

      authContext.useAuth.mockReturnValue({
        user: { id: 's1', role: 'student' },
        profile: { id: 'p1', current_level: 'Class 10', is_complete: true },
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/assessment?mode=take']}>
          <AssessmentPage />
        </MemoryRouter>
      );

      // Should automatically resume into Question 2 (index 1) since Question 1 was already answered
      await waitFor(() => {
        expect(apiClient.startAssessmentAttemptApi).toHaveBeenCalledWith('c10-discovery');
        expect(apiClient.getAttemptDetailApi).toHaveBeenCalledWith('att-123');
        expect(screen.getByText(/Question 2: Do you enjoy science experiments/i)).toBeTruthy();
      });
    });
  });

  describe('Recommendations Recovery Gap', () => {
    it('automatically generates recommendations if user has a completed result but recommendations were missing', async () => {
      const mockResult = {
        id: 'res-1',
        is_current: true,
        primary_stream_recommendation: 'PUC Science',
        summary_text: 'Summary',
        dimension_scores: { science: 80 },
      };

      const mockGeneratedRecs = {
        top_careers: [{ title: 'Software Engineer', stream: 'Science' }],
      };

      apiClient.getMyLatestAssessmentResultApi.mockResolvedValue(mockResult);
      // Empty latest recommendations -> triggers fallback generation
      apiClient.getLatestRecommendationsApi.mockResolvedValue(null);
      apiClient.generateRecommendationsApi.mockResolvedValue(mockGeneratedRecs);

      authContext.useAuth.mockReturnValue({
        user: { id: 's1', role: 'student' },
        profile: { id: 'p1', current_level: 'Class 10', is_complete: true },
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/assessment']}>
          <AssessmentPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiClient.getLatestRecommendationsApi).toHaveBeenCalled();
        expect(apiClient.generateRecommendationsApi).toHaveBeenCalled();
      });
    });

    it('shows recovery retry button if recommendations generation encounters an error', async () => {
      const mockResult = {
        id: 'res-1',
        is_current: true,
        primary_stream_recommendation: 'PUC Science',
        summary_text: 'Summary',
        dimension_scores: { science: 80 },
      };

      apiClient.getMyLatestAssessmentResultApi.mockResolvedValue(mockResult);
      apiClient.getLatestRecommendationsApi.mockRejectedValue(new Error('Network error'));
      apiClient.generateRecommendationsApi.mockRejectedValue(new Error('Generation failed'));

      authContext.useAuth.mockReturnValue({
        user: { id: 's1', role: 'student' },
        profile: { id: 'p1', current_level: 'Class 10', is_complete: true },
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/assessment']}>
          <AssessmentPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Your assessment is saved, but personalised recommendations could not be generated right now./i)
        ).toBeTruthy();
        expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy();
      });
    });

    it('displays outdated recommendations banner and preserves existing recommendations if regeneration fails', async () => {
      const mockResult = {
        id: 'res-1',
        is_current: false,
        primary_stream_recommendation: 'PUC Science',
        summary_text: 'Summary',
        dimension_scores: { science: 80 },
      };

      const mockOutdatedRecs = {
        is_outdated: true,
        outdated_reason: 'Your assessment is outdated for your current academic stage.',
        recommendations: [
          {
            rank: 1,
            pathway_id: 'c10-puc',
            pathway_title: 'Pre-University College (PUC)',
            match_score: 80,
            match_label: 'High',
            reasons: ['Strong science aptitude'],
          }
        ],
      };

      apiClient.getMyLatestAssessmentResultApi.mockResolvedValue(mockResult);
      apiClient.getLatestRecommendationsApi.mockResolvedValue(mockOutdatedRecs);
      apiClient.generateRecommendationsApi.mockRejectedValue(new Error('Regeneration server error'));

      authContext.useAuth.mockReturnValue({
        user: { id: 's1', role: 'student', full_name: 'Student One' },
        profile: { id: 'p1', current_level: 'PUC 1', stream: 'Science', is_complete: true },
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Recommendations Outdated/i)).toBeTruthy();
        expect(screen.getByText(/Your assessment is outdated for your current academic stage/i)).toBeTruthy();
        expect(screen.getByText(/Pre-University College \(PUC\)/i)).toBeTruthy();
      });

      // User clicks Update Recommendations
      const updateBtn = screen.getByRole('button', { name: /Update Recommendations/i });
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(apiClient.generateRecommendationsApi).toHaveBeenCalled();
        // Preserves existing recommendations and shows failure message
        expect(screen.getByText(/Regeneration server error/i)).toBeTruthy();
        expect(screen.getByText(/Pre-University College \(PUC\)/i)).toBeTruthy();
        expect(screen.getByText(/Recommendations Outdated/i)).toBeTruthy();
      });
    });

    it('displays unable to verify freshness banner and offers retry check when downstream freshness check is unknown', async () => {
      const mockResult = {
        id: 'res-1',
        is_current: true,
        primary_stream_recommendation: 'Class 10 General',
        summary_text: 'Summary',
        dimension_scores: { science: 80 },
      };

      const mockUnknownRecs = {
        freshness_status: 'unknown',
        is_outdated: false,
        outdated_reason: 'Unable to verify recommendation freshness. Downstream service unavailable.',
        recommendations: [
          {
            rank: 1,
            pathway_id: 'c10-puc',
            pathway_title: 'Pre-University College (PUC)',
            match_score: 80,
            match_label: 'High',
            reasons: ['Strong science aptitude'],
          }
        ],
      };

      apiClient.getMyLatestAssessmentResultApi.mockResolvedValue(mockResult);
      apiClient.getLatestRecommendationsApi.mockResolvedValue(mockUnknownRecs);

      authContext.useAuth.mockReturnValue({
        user: { id: 's1', role: 'student', full_name: 'Student One' },
        profile: { id: 'p1', current_level: 'Class 10', stream: null, is_complete: true },
        loading: false,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Unable to verify freshness/i)).toBeTruthy();
        expect(screen.getByText(/Unable to verify recommendation freshness/i)).toBeTruthy();
        expect(screen.getByText(/Pre-University College \(PUC\)/i)).toBeTruthy();
      });

      const retryBtn = screen.getByRole('button', { name: /Retry Check/i });
      expect(retryBtn).toBeTruthy();
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(apiClient.getLatestRecommendationsApi).toHaveBeenCalledTimes(2);
      });
    });
  });
});

