import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PathwaysPage from '../PathwaysPage';
import * as apiClient from '../../api/client';
import * as authContext from '../../context/AuthContext';
import * as sidebarContext from '../../context/SidebarContext';

// Mock dependencies
vi.mock('../../api/client', () => ({
  getPathwaysApi: vi.fn(),
  getPathwayDetailApi: vi.fn(),
  getLatestRecommendationsApi: vi.fn(),
  createStudentGoalApi: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../../context/SidebarContext', () => ({
  useSidebar: vi.fn(),
  SidebarProvider: ({ children }) => children,
}));

// Mock scrollIntoView which jsdom does not implement
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

describe('PathwaysPage Interactive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authContext.useAuth.mockReturnValue({
      user: { id: 'test-user', role: 'student' },
      profile: {
        id: 'test-profile',
        full_name: 'Test Student',
        current_level: 'Class 10',
        is_complete: true,
      },
      loading: false,
    });

    sidebarContext.useSidebar.mockReturnValue({
      isCollapsed: false,
    });

    apiClient.getLatestRecommendationsApi.mockResolvedValue({
      recommendations: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = (initialEntries = ['/pathways']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <PathwaysPage />
      </MemoryRouter>
    );
  };

  it('handles list failure → Retry → success lifecycle correctly', async () => {
    // 1. Initial list request fails
    apiClient.getPathwaysApi.mockRejectedValueOnce(new Error('503 Service Unavailable'));

    renderComponent();

    // Verify error banner is shown
    expect(await screen.findByText('Unable to Fetch Pathways')).toBeTruthy();
    expect(screen.getByText('503 Service Unavailable')).toBeTruthy();

    const retryBtn = screen.getByRole('button', { name: /Retry Fetch/i });
    expect(retryBtn).toBeTruthy();

    // 2. Prepare successful recovery
    apiClient.getPathwaysApi.mockResolvedValueOnce({
      total: samplePathways.length,
      pathways: samplePathways,
    });

    // 3. Click Retry (never passes click event as cancellation callback)
    fireEvent.click(retryBtn);

    // 4. Transitions out of error to loaded content
    await waitFor(() => {
      expect(screen.queryByText('Unable to Fetch Pathways')).toBeNull();
    });

    expect(await screen.findByText('Science Stream')).toBeTruthy();
    expect(screen.getByText('Commerce Stream')).toBeTruthy();
  });

  it('handles repeated failures with structured array/object errors without crashing React', async () => {
    // 1. First failure with FastAPI Pydantic array detail: [{ msg: "..." }]
    const arrayError = {
      response: {
        data: {
          detail: [
            { loc: ['body', 'education_level'], msg: 'Invalid education level parameter' }
          ]
        }
      }
    };
    apiClient.getPathwaysApi.mockRejectedValueOnce(arrayError);

    renderComponent();

    // Verify array error message is normalized and rendered as a string
    expect(await screen.findByText('Unable to Fetch Pathways')).toBeTruthy();
    expect(screen.getByText('Invalid education level parameter')).toBeTruthy();

    // 2. Retry fails again with object detail: { msg: "..." }
    const objectError = {
      response: {
        data: {
          detail: { msg: 'Database connection failed' }
        }
      }
    };
    apiClient.getPathwaysApi.mockRejectedValueOnce(objectError);

    const retryBtn = screen.getByRole('button', { name: /Retry Fetch/i });
    fireEvent.click(retryBtn);

    // Verify second error is normalized and visible
    expect(await screen.findByText('Database connection failed')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Retry Fetch/i })).toBeTruthy();
  });

  it('handles detail failure → Retry → success and clears previous detail error', async () => {
    // 1. List succeeds, detail request for selected node fails
    apiClient.getPathwaysApi.mockResolvedValue({
      total: samplePathways.length,
      pathways: samplePathways,
    });

    const detailError = {
      response: {
        data: {
          detail: "Pathway 'puc-science' detail is temporarily unavailable."
        }
      }
    };
    apiClient.getPathwayDetailApi.mockRejectedValueOnce(detailError);

    // Initial node is puc-science via query param to trigger detail fetch
    renderComponent(['/pathways?pathway_id=puc-science']);

    // Verify list loaded
    expect(await screen.findByText('PUC Science Stream')).toBeTruthy();

    // Verify detail panel shows error state and error message
    expect(await screen.findByText('Error Loading Detail')).toBeTruthy();
    expect(screen.getByText("Pathway 'puc-science' detail is temporarily unavailable.")).toBeTruthy();

    const detailRetryBtn = screen.getByRole('button', { name: /^Retry$/i });
    expect(detailRetryBtn).toBeTruthy();

    // 2. Service restored, prepare successful response
    apiClient.getPathwayDetailApi.mockResolvedValueOnce(samplePathways[0]);

    // 3. Click detail Retry
    fireEvent.click(detailRetryBtn);

    // 4. Verify previous error is cleared and detail content is rendered
    await waitFor(() => {
      expect(screen.queryByText('Error Loading Detail')).toBeNull();
    });

    expect(await screen.findByText('PCMB Science')).toBeTruthy();
    expect(screen.getByText('Class 11 Science Admission')).toBeTruthy();
  });

  it('discards late responses when selections change rapidly (race condition guard)', async () => {
    apiClient.getPathwaysApi.mockResolvedValue({
      total: samplePathways.length,
      pathways: samplePathways,
    });

    let resolveScience;
    const slowSciencePromise = new Promise((resolve) => {
      resolveScience = resolve;
    });

    apiClient.getPathwayDetailApi.mockImplementation((id) => {
      if (id === 'puc-science') {
        return slowSciencePromise;
      }
      if (id === 'puc-commerce') {
        return Promise.resolve(samplePathways[1]);
      }
      return Promise.resolve(samplePathways[0]);
    });

    renderComponent(['/pathways?pathway_id=puc-science']);

    // Wait for list to load
    await waitFor(() => {
      expect(apiClient.getPathwayDetailApi).toHaveBeenCalledWith('puc-science');
    });

    // Rapidly switch to puc-commerce while science request is still in flight
    const commerceNode = await screen.findByRole('button', { name: /Explore Commerce Stream/i });
    fireEvent.click(commerceNode);

    // Wait for fast commerce request to complete and display
    expect(await screen.findByText('EBAC Commerce')).toBeTruthy();

    // Now resolve the delayed science response
    resolveScience(samplePathways[0]);

    // Give microtasks time to execute
    await new Promise((r) => setTimeout(r, 50));

    // Verify commerce remains selected and is NOT overwritten by science!
    expect(screen.getByText('EBAC Commerce')).toBeTruthy();
    expect(screen.queryByText('PCMB Science')).toBeNull();
  });

  it('safely handles unmount while requests are in flight without errors', async () => {
    let resolveHang;
    const hangingPromise = new Promise((resolve) => {
      resolveHang = resolve;
    });

    apiClient.getPathwaysApi.mockImplementation(() => hangingPromise);

    const { unmount } = renderComponent();

    // Verify component is in loading state
    expect(screen.getByText(/Career & Education Pathways/i)).toBeTruthy();

    // Unmount while request is active
    unmount();

    // Resolve after unmount
    resolveHang({ total: samplePathways.length, pathways: samplePathways });

    await new Promise((r) => setTimeout(r, 20));
    // No error or crash should occur
  });
});
