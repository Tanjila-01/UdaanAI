import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminPathwayPreviewPage from '../AdminPathwayPreviewPage';
import PathwaysPage from '../../PathwaysPage';
import HomePage from '../../HomePage';
import AdminRoute from '../../../components/AdminRoute';
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

describe('Admin Pathway Preview Journey & Route Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    sidebarContext.useSidebar.mockReturnValue({
      isCollapsed: false,
    });

    apiClient.getPathwaysApi.mockResolvedValue({
      total: samplePathways.length,
      pathways: samplePathways,
    });

    apiClient.getPathwayDetailApi.mockImplementation(async (id) => {
      const match = samplePathways.find((p) => p.id === id);
      return match || samplePathways[0];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('admin stream click on HomePage navigates to /admin/pathways with matching query', async () => {
    // Authenticated admin user without a student profile
    authContext.useAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'admin@udaan.ai', role: 'admin' },
      profile: null,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/pathways" element={<div data-testid="admin-pathways-page">Admin Pathways Route</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Find a map node to click
    const scienceNode = await screen.findByRole('button', { name: /Explore Science Stream/i });
    expect(scienceNode).toBeTruthy();
    fireEvent.click(scienceNode);

    // Verifies admin is navigated directly to /admin/pathways, not /pathways
    expect(await screen.findByTestId('admin-pathways-page')).toBeTruthy();
  });

  it('admin without a student profile can load and refresh the preview page', async () => {
    authContext.useAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'admin@udaan.ai', role: 'admin' },
      profile: null,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/pathways?pathway_id=puc-science']}>
        <AdminPathwayPreviewPage />
      </MemoryRouter>
    );

    // Shows "Pathway preview" badge
    expect(await screen.findByText('Pathway preview')).toBeTruthy();
    // Shows clear return link to admin dashboard
    const returnLink = screen.getByRole('link', { name: /Back to Admin Dashboard/i });
    expect(returnLink).toBeTruthy();
    expect(returnLink.getAttribute('href')).toBe('/admin');

    // Confirms pathway content loads
    expect(await screen.findByRole('heading', { name: 'PUC Science Stream' })).toBeTruthy();
  });

  it('preview makes NO personal student-data or goal write requests', async () => {
    authContext.useAuth.mockReturnValue({
      user: { id: 'admin-1', email: 'admin@udaan.ai', role: 'admin' },
      profile: null,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/pathways?pathway_id=puc-science']}>
        <AdminPathwayPreviewPage />
      </MemoryRouter>
    );

    await screen.findByText('Pathway preview');

    // Verify catalog APIs were called
    expect(apiClient.getPathwaysApi).toHaveBeenCalled();

    // Verify NO student-specific profile, recommendation, or goal write APIs were called
    expect(apiClient.getMyProfileApi).not.toHaveBeenCalled();
    expect(apiClient.getLatestRecommendationsApi).not.toHaveBeenCalled();
    expect(apiClient.createStudentGoalApi).not.toHaveBeenCalled();

    // Verify goal selection action is NOT displayed
    expect(screen.queryByText('Choose This Direction')).toBeNull();
    expect(screen.queryByText('Choose Option Goal')).toBeNull();
  });

  it('guests cannot enter admin-only preview route and are redirected to /admin/login', async () => {
    // Unauthenticated visitor
    authContext.useAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/pathways']}>
        <Routes>
          <Route
            path="/admin/pathways"
            element={
              <AdminRoute>
                <AdminPathwayPreviewPage />
              </AdminRoute>
            }
          />
          <Route path="/admin/login" element={<div data-testid="admin-login-page">Admin Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('admin-login-page')).toBeTruthy();
    expect(screen.queryByText('Pathway preview')).toBeNull();
  });

  it('students cannot enter admin-only preview route and are redirected to /dashboard', async () => {
    // Authenticated student
    authContext.useAuth.mockReturnValue({
      user: { id: 'student-1', role: 'student' },
      profile: { id: 'profile-1', is_complete: true },
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/pathways']}>
        <Routes>
          <Route
            path="/admin/pathways"
            element={
              <AdminRoute>
                <AdminPathwayPreviewPage />
              </AdminRoute>
            }
          />
          <Route path="/dashboard" element={<div data-testid="student-dashboard">Student Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('student-dashboard')).toBeTruthy();
    expect(screen.queryByText('Pathway preview')).toBeNull();
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
