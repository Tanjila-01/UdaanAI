import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DiscussMatchesLink from '../../components/DiscussMatchesLink';
import CareerAdvisorPage from '../CareerAdvisorPage';
import { getCareerAnswerApi, listCareerHistoryApi, getCareerHistoryApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../api/client', () => ({ getCareerAnswerApi: vi.fn(), listCareerHistoryApi: vi.fn(), getCareerHistoryApi: vi.fn() }));
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
    expect(screen.getByRole('status').textContent).toContain('Researching');
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

it('refreshes a saved explanation using current context while preserving the old snapshot', async () => {
  const request = { question: 'Explain my saved career recommendations.', intent: 'explain_recommendations', pathway_id: null, language: 'en' };
  listCareerHistoryApi.mockResolvedValue({ items: [{ id: 'old', question: request.question, created_at: '2026-09-01T10:00:00Z' }], has_more: false });
  getCareerHistoryApi.mockResolvedValue({ id: 'old', request, created_at: '2026-09-01T10:00:00Z', response: { ...response, answer: 'Your previous saved explanation.', status: 'recommendations_explained' } });
  getCareerAnswerApi.mockResolvedValue({ ...response, status: 'needs_update', answer: 'Please refresh your recommendations.' });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Previous questions' }));
  fireEvent.click(await screen.findByRole('button', { name: /^Explain my saved career recommendations\./ }));
  const update = await screen.findByRole('button', { name: 'Refresh answer' });
  await waitFor(() => expect(update.disabled).toBe(false));
  expect(getCareerAnswerApi).not.toHaveBeenCalled();
  fireEvent.click(update);
  expect(await screen.findByText('Please refresh your recommendations.')).toBeTruthy();
  expect(screen.getByText('Your previous saved explanation.')).toBeTruthy();
  expect(getCareerAnswerApi).toHaveBeenCalledTimes(1);
  expect(getCareerAnswerApi.mock.calls[0][0]).toEqual({ ...request, answer_mode: 'auto', refresh: true });
});

it('links an explicit follow-up to the saved answer and clears context after sending', async () => {
  getCareerAnswerApi.mockResolvedValueOnce({ ...response, history_id: 'saved-topic', sources: [{ reference: 1, chunk_id: 'chunk', title: 'Software development', references: [] }] }).mockResolvedValueOnce({ ...response, answer: 'A newly checked answer.', conversation_topic: 'Software development' });
  mount(); send('What does a developer do?');
  fireEvent.click(await screen.findByRole('button', { name: 'Ask a follow-up' }));
  expect(screen.getByText('Software development')).toBeTruthy();
  send('What do they do each day?');
  expect(await screen.findByText('A newly checked answer.')).toBeTruthy();
  expect(getCareerAnswerApi.mock.calls[1][0]).toEqual({ question: 'What do they do each day?', intent: 'explore', language: 'en', follow_up_to: 'saved-topic' });
  expect(screen.queryByRole('button', { name: 'Clear follow-up context' })).toBeNull();
});

it('lets a student clear the selected topic before asking a new question', async () => {
  getCareerAnswerApi.mockResolvedValue({ ...response, history_id: 'saved-topic' });
  mount(); send('What does a developer do?');
  fireEvent.click(await screen.findByRole('button', { name: 'Ask a follow-up' }));
  fireEvent.click(screen.getByRole('button', { name: 'Clear follow-up context' }));
  send('What does an electrician do?');
  await waitFor(() => expect(getCareerAnswerApi).toHaveBeenCalledTimes(2));
  expect(getCareerAnswerApi.mock.calls[1][0].follow_up_to).toBeUndefined();
});

it('shows a course-selection clarification as a normal answer rather than a rejection', async () => {
  getCareerAnswerApi.mockResolvedValue({ ...response, status: 'needs_clarification', answer: 'Please name the course or qualification and the college you mean.' });
  mount(); send('how much year course is and will i get selected ?');
  expect(await screen.findByText('Please name the course or qualification and the college you mean.')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('keeps research internal without asking students to select an answer source', async () => {
  getCareerAnswerApi.mockResolvedValue({
    ...response,
    answer_origin: 'web',
    checked_at: '2026-09-13T12:00:00Z',
    sources: [{ reference: 1, chunk_id: 'web-1', title: 'AI Overview', scope: 'Web evidence', references: [{ url: 'https://en.wikipedia.org/wiki/Artificial_intelligence' }] }]
  });
  mount();
  expect(screen.queryByRole('combobox', { name: 'Answer source' })).toBeNull();
  send('What is artificial intelligence?');
  expect(await screen.findByText(response.answer)).toBeTruthy();
  expect(getCareerAnswerApi.mock.calls[0][0].answer_mode).toBeUndefined();
  expect(screen.queryByRole('button', { name: 'Search web for this question' })).toBeNull();
  expect(screen.getByText(/Sources checked online.*Checked/)).toBeTruthy();
});

it('does not falsely claim sources checked online when sources list is empty (greetings/failures)', async () => {
  getCareerAnswerApi.mockResolvedValue({
    ...response,
    answer_origin: 'web',
    status: 'needs_clarification',
    answer: 'Hi! Ask me about a subject, a course, career options or your next education step.',
    sources: [],
    checked_at: '2026-09-13T12:00:00Z'
  });
  mount();
  send('Hi');
  expect(await screen.findByText('Hi! Ask me about a subject, a course, career options or your next education step.')).toBeTruthy();
  expect(screen.queryByText(/Sources checked online/)).toBeNull();
});

it('does not falsely claim sources checked online when web research fails or times out', async () => {
  getCareerAnswerApi.mockResolvedValue({
    ...response,
    answer_origin: 'web',
    status: 'unavailable',
    answer: 'I could not finish researching that in time. Please try again shortly.',
    sources: [],
    checked_at: '2026-09-13T12:00:00Z'
  });
  mount();
  send('Complex question that timed out');
  expect(await screen.findByText('I could not finish researching that in time. Please try again shortly.')).toBeTruthy();
  expect(screen.queryByText(/Sources checked online/)).toBeNull();
});
