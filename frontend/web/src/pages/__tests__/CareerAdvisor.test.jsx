import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DiscussMatchesLink from '../../components/DiscussMatchesLink';
import CareerAdvisorPage from '../CareerAdvisorPage';
import { getCareerAnswerApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../api/client', () => ({ getCareerAnswerApi: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../context/SidebarContext', () => ({ useSidebar: () => ({ isCollapsed: false }) }));
vi.mock('../../components/Sidebar', () => ({ default: () => null }));
vi.mock('../../components/Header', () => ({ default: () => null }));
vi.mock('../../components/EditProfileDrawer', () => ({ default: () => null }));
const response = { status: 'answered', answer: 'Developers build software. [1]', sources: [], recommendations: [], context_status: 'not_requested' };
const mount = () => render(<MemoryRouter><CareerAdvisorPage /></MemoryRouter>);
const send = (question = 'What does a developer do?') => {
  fireEvent.change(screen.getByLabelText('Ask a career question'), { target: { value: question } });
  fireEvent.click(screen.getByRole('button', { name: 'Ask Udaan' }));
};
beforeEach(() => { vi.resetAllMocks(); useAuth.mockReturnValue({ user: { id: 'student-one' } }); });
afterEach(cleanup);

describe('Career advisor', () => {
  it('sends independent questions and displays safe source links', async () => {
    getCareerAnswerApi.mockResolvedValue({ ...response, sources: [{ reference: 1, chunk_id: 'chunk', title: 'Career duties', scope: 'General duties', reviewed_on: '2026-09-12', references: [{ url: 'https://www.bls.gov/', publisher: 'BLS' }, { url: 'javascript:alert(1)', publisher: 'Unsafe' }] }] });
    mount(); send();
    expect(await screen.findByText(response.answer)).toBeTruthy();
    fireEvent.click(screen.getByText('View sources'));
    expect(screen.getByRole('link', { name: /BLS/ }).getAttribute('href')).toBe('https://www.bls.gov/');
    expect(screen.queryByRole('link', { name: /Unsafe/ })).toBeNull();
    send('What does a designer do?');
    await waitFor(() => expect(getCareerAnswerApi).toHaveBeenCalledTimes(2));
    expect(getCareerAnswerApi.mock.calls[1][0]).toEqual({ question: 'What does a designer do?', intent: 'explore', language: 'en' });
  });
  it('retries a busy request without duplicating the student question', async () => {
    getCareerAnswerApi.mockRejectedValueOnce({ response: { status: 429 } }).mockResolvedValueOnce(response);
    mount(); send();
    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry answer' }));
    expect(await screen.findByText(response.answer)).toBeTruthy();
    expect(screen.getAllByText('What does a developer do?')).toHaveLength(1);
    expect(getCareerAnswerApi.mock.calls[1][0]).toEqual(getCareerAnswerApi.mock.calls[0][0]);
  });
  it('prevents duplicate submissions and aborts on leaving', async () => {
    getCareerAnswerApi.mockReturnValue(new Promise(() => {}));
    const view = mount(); send(); send();
    expect(getCareerAnswerApi).toHaveBeenCalledTimes(1);
    const signal = getCareerAnswerApi.mock.calls[0][1].signal;
    expect(screen.getByRole('status').textContent).toContain('Preparing');
    view.unmount(); expect(signal.aborted).toBe(true);
  });
  it('clears the previous student session and ignores its late answer', async () => {
    let resolve;
    getCareerAnswerApi.mockReturnValue(new Promise(done => { resolve = done; }));
    const view = mount(); send();
    useAuth.mockReturnValue({ user: { id: 'student-two' } });
    view.rerender(<MemoryRouter><CareerAdvisorPage /></MemoryRouter>);
    resolve(response);
    await waitFor(() => expect(screen.queryByText('What does a developer do?')).toBeNull());
    expect(screen.queryByText(response.answer)).toBeNull();
  });
  it('offers setup links when saved recommendations are missing', async () => {
    getCareerAnswerApi.mockResolvedValue({ ...response, status: 'needs_update', answer: 'Complete your assessment first.' });
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Explain my recommendations' }));
    expect(await screen.findByRole('link', { name: 'Take assessment' })).toBeTruthy();
    expect(getCareerAnswerApi.mock.calls[0][0].intent).toBe('explain_recommendations');
  });
  it('offers retry for a domain unavailable response but not missing evidence', async () => {
    getCareerAnswerApi.mockResolvedValueOnce({ ...response, status: 'unavailable', answer: 'Local AI unavailable.' }).mockResolvedValueOnce({ ...response, status: 'insufficient_evidence', answer: 'No verified evidence.' });
    mount(); send();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry answer' }));
    expect(await screen.findByText('No verified evidence.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry answer' })).toBeNull();
  });
  it('rejects blank questions and handles malformed service responses', async () => {
    getCareerAnswerApi.mockResolvedValue({ answer: null });
    mount(); send('  '); expect(getCareerAnswerApi).not.toHaveBeenCalled();
    send(); expect(await screen.findByRole('alert')).toBeTruthy();
  });
  it('renders saved recommendations without presenting match scores as probabilities', async () => {
    getCareerAnswerApi.mockResolvedValue({ ...response, status: 'recommendations_explained', recommendations: [{ pathway_id: 'software', title: 'Software development', rank: 1, match_label: 'Strong match', match_score: 80, explanation: 'Your interests align with technical work.' }] });
    mount(); fireEvent.click(screen.getByRole('button', { name: 'Explain my recommendations' }));
    expect(await screen.findByText('1. Software development')).toBeTruthy();
    expect(screen.getByText(/not a guarantee of success/)).toBeTruthy();
  });
});

it('connects saved matches to one automatic explanation, including StrictMode', async () => {
  getCareerAnswerApi.mockResolvedValue({ ...response, status: 'recommendations_explained' });
  render(<React.StrictMode><MemoryRouter initialEntries={['/results']}><Routes>
    <Route path="/results" element={<DiscussMatchesLink />} />
    <Route path="/student/ai-career" element={<CareerAdvisorPage />} />
  </Routes></MemoryRouter></React.StrictMode>);
  fireEvent.click(screen.getByRole('link', { name: 'Understand my matches with Udaan' }));
  expect(await screen.findByText(response.answer)).toBeTruthy();
  expect(getCareerAnswerApi).toHaveBeenCalledTimes(1);
  expect(getCareerAnswerApi.mock.calls[0][0]).toEqual({ question: 'Explain my saved career recommendations.', intent: 'explain_recommendations', language: 'en' });
  expect(screen.getByRole('link', { name: 'Explore my pathways' }).getAttribute('href')).toBe('/pathways');
  fireEvent.click(screen.getByRole('button', { name: 'Start fresh' }));
  expect(screen.getByText('Where could your curiosity take you?')).toBeTruthy();
  expect(getCareerAnswerApi).toHaveBeenCalledTimes(1);
});

it('does not automatically request explanations on an ordinary advisor visit', () => {
  mount();
  expect(getCareerAnswerApi).not.toHaveBeenCalled();
});
