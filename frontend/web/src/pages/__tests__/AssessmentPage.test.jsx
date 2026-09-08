import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AssessmentPage from '../AssessmentPage';
import * as apiClient from '../../api/client';
import * as authContext from '../../context/AuthContext';
import * as sidebarContext from '../../context/SidebarContext';

vi.mock('../../api/client', () => ({
  getMyAssignedAssessmentApi: vi.fn(),
  getAssessmentsApi: vi.fn(),
  getAssessmentDetailApi: vi.fn(),
  startAssessmentAttemptApi: vi.fn(),
  submitAssessmentAnswerApi: vi.fn(),
  completeAssessmentAttemptApi: vi.fn(),
  getMyLatestAssessmentResultApi: vi.fn(),
  generateRecommendationsApi: vi.fn(),
  getLatestRecommendationsApi: vi.fn(),
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

describe('AssessmentPage Score Presentation & Interest Reflection', () => {
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
      toggleSidebar: vi.fn(),
    });
  });

  it('renders scores 0, 30, 75, and 100 accurately without extra division by 15', async () => {
    const mockResult = {
      id: 'res-1',
      is_current: true,
      primary_stream_recommendation: 'PUC Science',
      secondary_stream_recommendation: 'PUC Commerce',
      top_career_match: 'Robotics Engineer',
      summary_text: 'Summary of student interests.',
      dimension_scores: {
        science: 0,
        commerce: 30,
        arts: 75,
        engineering: 100,
      },
    };

    apiClient.getMyLatestAssessmentResultApi.mockResolvedValue(mockResult);
    apiClient.getLatestRecommendationsApi.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AssessmentPage />
      </MemoryRouter>
    );

    // Wait for the result screen to load
    await waitFor(() => {
      expect(screen.getByText('Interest Reflection')).toBeTruthy();
    });

    const reflectionHeading = screen.getByText('Interest Reflection');
    const reflectionCard = reflectionHeading.closest('div.bg-white');
    expect(reflectionCard).toBeTruthy();
    const { getByText, queryByText } = within(reflectionCard);

    // 1. Verify "Interest Reflection" header and absence of "Aptitude Breakdown"
    expect(screen.queryByText('Aptitude Breakdown')).toBeNull();

    // 2. Verify explanatory wording regarding current interests
    expect(
      getByText(
        'These results describe your current interests, not proven ability or permanent career suitability.'
      )
    ).toBeTruthy();

    // 3. Verify aligned dimension labels inside the reflection section
    expect(getByText('PUC Science')).toBeTruthy();
    expect(getByText('PUC Commerce')).toBeTruthy();
    expect(getByText('PUC Arts & Humanities')).toBeTruthy();
    expect(getByText('Engineering & Technology')).toBeTruthy();

    // 4. Verify exact percentage values are rendered accurately
    expect(getByText('0%')).toBeTruthy();
    expect(getByText('30%')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();

    // Ensure no broken "pts" or clamped values from old (score / 15 * 100) formula
    expect(queryByText(/pts/i)).toBeNull();
  });

  it('aligns response keys across specialized streams and renders progress bars accurately', async () => {
    const mockResult = {
      id: 'res-2',
      is_current: true,
      primary_stream_recommendation: 'PUC Commerce',
      secondary_stream_recommendation: 'Polytechnic Diploma',
      top_career_match: 'Financial Analyst',
      summary_text: 'Commerce analysis.',
      dimension_scores: {
        finance_banking: 30,
        business_management: 75,
        law_judiciary: 0,
        dcet_lateral_engineering: 100,
        apprenticeship_industry: 50,
      },
    };

    apiClient.getMyLatestAssessmentResultApi.mockResolvedValue(mockResult);
    apiClient.getLatestRecommendationsApi.mockResolvedValue([]);

    const { container } = render(
      <MemoryRouter>
        <AssessmentPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Interest Reflection')).toBeTruthy();
    });

    const reflectionCard = screen.getByText('Interest Reflection').closest('div.bg-white');
    const { getByText } = within(reflectionCard);

    // Verify mapped titles
    expect(getByText('Investment Banking & Finance')).toBeTruthy();
    expect(getByText('Business Management & Operations')).toBeTruthy();
    expect(getByText('Integrated Law & Judiciary')).toBeTruthy();
    expect(getByText('B.E Lateral Entry (DCET)')).toBeTruthy();
    expect(getByText('National Apprenticeship & Industry Jobs')).toBeTruthy();

    // Verify rendered score percentages
    expect(getByText('30%')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
    expect(getByText('0%')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();

    // Verify progress bar style widths within reflectionCard
    const progressBars = reflectionCard.querySelectorAll('.bg-\\[\\#005F60\\].h-full.rounded-full');
    const widths = Array.from(progressBars).map((el) => el.style.width);
    expect(widths).toContain('30%');
    expect(widths).toContain('75%');
    expect(widths).toContain('0%');
    expect(widths).toContain('100%');
    expect(widths).toContain('50%');
  });

  it('gracefully formats unknown dimension keys and handles boundary scores', async () => {
    const mockResult = {
      id: 'res-3',
      is_current: true,
      primary_stream_recommendation: 'PUC Arts',
      secondary_stream_recommendation: 'ITI Vocational Trades',
      top_career_match: 'Graphic Designer',
      summary_text: 'Arts evaluation.',
      dimension_scores: {
        custom_creative_stream: 75,
        energy_electrical: 0,
      },
    };

    apiClient.getMyLatestAssessmentResultApi.mockResolvedValue(mockResult);
    apiClient.getLatestRecommendationsApi.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AssessmentPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Interest Reflection')).toBeTruthy();
    });

    const reflectionCard = screen.getByText('Interest Reflection').closest('div.bg-white');
    const { getByText } = within(reflectionCard);

    // Custom dimension key formatted cleanly with Title Case fallback
    expect(getByText('Custom Creative Stream')).toBeTruthy();
    expect(getByText('Electrical & Solar Energy Trade')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
    expect(getByText('0%')).toBeTruthy();
  });
});
