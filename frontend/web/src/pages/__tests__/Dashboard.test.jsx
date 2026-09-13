import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../DashboardPage';
import * as api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../api/client', () => ({ getMyLatestAssessmentResultApi: vi.fn(), getMyStudentGoalApi: vi.fn(), getLatestRecommendationsApi: vi.fn(), generateRecommendationsApi: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../context/SidebarContext', () => ({ useSidebar: () => ({ isCollapsed: false }) }));
vi.mock('../../components/Sidebar', () => ({ default: () => null }));
vi.mock('../../components/Header', () => ({ default: () => null }));
vi.mock('../../components/EditProfileDrawer', () => ({ default: ({ isOpen }) => isOpen ? <div role="dialog">Edit profile</div> : null }));
vi.mock('../../components/StudentJourneyNavigator', () => ({ default: () => null }));

const assessment = { is_current: true, primary_stream_recommendation: 'Science', top_career_match: 'Technology', dimension_scores: { science: 75 } };
const mount = () => render(<MemoryRouter><DashboardPage /></MemoryRouter>);
beforeEach(() => {
  vi.resetAllMocks();
  useAuth.mockReturnValue({ user: { id: 'one', full_name: 'Asha Rao' }, profile: {}, loading: false });
  api.getMyLatestAssessmentResultApi.mockResolvedValue(null);
  api.getMyStudentGoalApi.mockResolvedValue(null);
  api.getLatestRecommendationsApi.mockResolvedValue({ recommendations: [] });
});
afterEach(cleanup);

describe('Student dashboard', () => {
  it('guides a new student without inventing academic details and opens profile editing', async () => {
    mount();
    expect((await screen.findByRole('link', { name: /^Discover my interests/ })).getAttribute('href')).toBe('/assessment?mode=take');
    expect(screen.queryByText(/Government High School|Bengaluru Urban|10th Standard/)).toBeNull();
    expect(screen.getByRole('link', { name: /Talk to your AI advisor/ }).getAttribute('href')).toBe('/student/ai-career');
    fireEvent.click(screen.getByRole('button', { name: /Edit academic profile/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
  it('prioritizes refreshing a historical assessment even when a goal exists', async () => {
    api.getMyLatestAssessmentResultApi.mockResolvedValue({ ...assessment, is_current: false });
    api.getMyStudentGoalApi.mockResolvedValue({ goal_title: 'Engineering', progress: { completed: 1, total: 4, percentage: 25 } });
    mount();
    expect((await screen.findByRole('link', { name: /^Refresh my interests/ })).getAttribute('href')).toBe('/assessment?mode=take');
    expect(screen.queryByRole('link', { name: /^Continue my roadmap/ })).toBeNull();
  });
  it('shows real progress and flags outdated matches without implying admission chances', async () => {
    api.getMyLatestAssessmentResultApi.mockResolvedValue(assessment);
    api.getMyStudentGoalApi.mockResolvedValue({ goal_title: 'Engineering', progress: { completed: 1, total: 4, percentage: 25 } });
    api.getLatestRecommendationsApi.mockResolvedValue({ is_outdated: true, recommendations: [{ pathway_id: 'c10-puc', pathway_title: 'PUC Science', rank: 1, match_label: 'High', match_score: 80 }] });
    mount();
    expect((await screen.findByRole('link', { name: /^Continue my roadmap/ })).getAttribute('href')).toBe('/my-roadmap');
    const stats = screen.getByRole('region', { name: /journey at a glance/ });
    expect(within(stats).getByText('25% complete')).toBeTruthy();
    expect(within(stats).getByText('1 of 4 milestones completed')).toBeTruthy();
    expect(within(stats).getByText(/Update needed/)).toBeTruthy();
    expect(screen.getByText(/Match scores are guidance, not admission chances/)).toBeTruthy();
  });
  it('distinguishes a failed progress request from a new student and can retry', async () => {
    api.getMyLatestAssessmentResultApi.mockRejectedValueOnce({ response: { status: 503 } }).mockResolvedValueOnce(assessment);
    mount();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /^Discover my interests/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Retry loading progress/ }));
    expect(await screen.findByRole('link', { name: /^Explore my pathways/ })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(api.getMyLatestAssessmentResultApi).toHaveBeenCalledTimes(2);
  });
});
