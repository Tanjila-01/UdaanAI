import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '../../HomePage';
import PathwaysPage from '../../PathwaysPage';
import AdminLayout from '../../../components/layout/AdminLayout';
import AppRoutes, { AdminPathwaysRedirect } from '../../../routes/AppRoutes';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import * as apiClient from '../../../api/client';
import * as authContext from '../../../context/AuthContext';
import * as sidebarContext from '../../../context/SidebarContext';

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

// Mock SidebarContext
vi.mock('../../../context/SidebarContext', () => ({
  useSidebar: vi.fn(),
  SidebarProvider: ({ children }) => children,
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const samplePathways = [
  {
    id: 'puc-science',
    title: 'PUC Science Stream',
    category: 'PRE-UNIVERSITY',
    duration: '2 Years',
    description: 'Premier science education preparing students for STEM careers.',
    options: [
      { id: 'opt-pcmb', option_name: 'PCMB Science', stream_or_code: 'PCMB', description: 'Physics, Chem, Math, Bio' }
    ],
    milestones: [
      { id: 'm1', step_number: 1, title: 'Class 11 Science Admission', description: 'Complete admission' }
    ],
  },
  {
    id: 'puc-commerce',
    title: 'PUC Commerce Stream',
    category: 'PRE-UNIVERSITY',
    duration: '2 Years',
    description: 'Business, accounting, and economics foundations.',
    options: [
      { id: 'opt-ebac', option_name: 'EBAC Commerce', stream_or_code: 'EBAC', description: 'Economics, Business, Accounts' }
    ],
    milestones: [
      { id: 'm2', step_number: 1, title: 'Class 11 Commerce Admission', description: 'Enroll in commerce' }
    ],
  },
];

describe('Admin Pathway Preview Journey, Homepage Integration & Route Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    sidebarContext.useSidebar.mockReturnValue({
      isCollapsed: false,
      toggleSidebar: vi.fn(),
    });

    apiClient.getPathwaysApi.mockResolvedValue({
      total: samplePathways.length,
      pathways: samplePathways,
    });

    apiClient.getPathwayDetailApi.mockImplementation(async (id) => {
      const match = samplePathways.find((p) => p.id === id);
      if (!match) {
        const error = new Error('Pathway not found');
        error.response = { status: 404 };
        throw error;
      }
      return match;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('/admin/pathways redirects to / with query parameters and #pathways preserved', async () => {
    const LocationWatcher = () => {
      const location = useLocation();
      return (
        <div data-testid="location-display">
          {location.pathname}
          {location.search}
          {location.hash}
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={['/admin/pathways?pathway_id=puc-science']}>
        <Routes>
          <Route path="/admin/pathways" element={<AdminPathwaysRedirect />} />
          <Route
            path="/"
            element={
              <div>
                <LocationWatcher />
                <div>Home Page Mock</div>
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    const display = await screen.findByTestId('location-display');
    expect(display.textContent).toBe('/?pathway_id=puc-science#pathways');
  });

  it('admin sidebar does not contain Pathway Preview link', () => {
    authContext.useAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'admin@udaan.ai', role: 'admin' },
      profile: null,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout>
          <div>Admin Content</div>
        </AdminLayout>
      </MemoryRouter>
    );

    expect(screen.queryByText(/Pathway Preview/i)).toBeNull();
    expect(screen.getAllByText(/Workshop Requests/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Scheduled$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Completed$/i).length).toBeGreaterThan(0);
  });

  it('admin stream click on HomePage stays on HomePage and displays read-only details without navigating away', async () => {
    authContext.useAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'admin@udaan.ai', role: 'admin' },
      profile: null,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    );

    // Click on the Science Stream button
    const scienceNode = await screen.findByRole('button', { name: /Explore Science Stream/i });
    fireEvent.click(scienceNode);

    // Confirms pathway content loads inline within public layout
    expect(await screen.findByRole('heading', { name: 'PUC Science Stream' })).toBeTruthy();
    expect(screen.getByText(/Premier science education preparing students for STEM careers/i)).toBeTruthy();

    // Verify NO student-specific profile, recommendation, or goal write APIs were called
    expect(apiClient.getMyProfileApi).not.toHaveBeenCalled();
    expect(apiClient.getLatestRecommendationsApi).not.toHaveBeenCalled();
    expect(apiClient.createStudentGoalApi).not.toHaveBeenCalled();

    // Verify student goal actions are not present in read-only panel
    expect(screen.queryByText('Choose This Direction')).toBeNull();
    expect(screen.queryByText('Choose Option Goal')).toBeNull();
  });

  it('handles loading, retry, and unavailable states for pathway details', async () => {
    authContext.useAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'admin@udaan.ai', role: 'admin' },
      profile: null,
      loading: false,
      logout: vi.fn(),
    });

    // Test error state and retry
    let callCount = 0;
    apiClient.getPathwayDetailApi.mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        throw new Error('Network error loading pathway');
      }
      return samplePathways[0];
    });

    render(
      <MemoryRouter initialEntries={['/?pathway_id=puc-science#pathways']}>
        <HomePage />
      </MemoryRouter>
    );

    // Initial load fails and shows retry button
    expect(await screen.findByText(/Network error loading pathway/i)).toBeTruthy();
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    expect(retryBtn).toBeTruthy();

    // Click retry
    fireEvent.click(retryBtn);

    // Successfully loads after retry
    expect(await screen.findByRole('heading', { name: 'PUC Science Stream' })).toBeTruthy();

    // Test 404 / unavailable state
    apiClient.getPathwayDetailApi.mockImplementation(async () => {
      const err = new Error('Pathway not found');
      err.response = { status: 404 };
      throw err;
    });

    render(
      <MemoryRouter initialEntries={['/?pathway_id=non-existent-id#pathways']}>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Pathway Details Unavailable/i)).toBeTruthy();
  });

  it('existing student pathway behavior still works on /pathways', async () => {
    // Complete student profile
    authContext.useAuth.mockReturnValue({
      user: { id: 'student-1', role: 'student' },
      profile: { id: 'profile-1', is_complete: true, current_level: 'Class 10' },
      loading: false,
      logout: vi.fn(),
    });

    apiClient.getLatestRecommendationsApi.mockResolvedValue({
      recommendations: [],
    });

    render(
      <MemoryRouter initialEntries={['/pathways?pathway_id=puc-science']}>
        <ProtectedRoute requireProfile={true}>
          <PathwaysPage />
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Student sees goal selection buttons
    expect(await screen.findByText('Career & Education Pathways')).toBeTruthy();
    expect(await screen.findByText('Choose This Direction')).toBeTruthy();
  });
});
