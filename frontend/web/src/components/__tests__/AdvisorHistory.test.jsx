import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AdvisorHistory from '../AdvisorHistory';
import { listCareerHistoryApi, getCareerHistoryApi, deleteCareerHistoryApi } from '../../api/client';
vi.mock('../../api/client', () => ({ listCareerHistoryApi: vi.fn(), getCareerHistoryApi: vi.fn(), deleteCareerHistoryApi: vi.fn() }));
const item = { id: 'saved-id', question: 'What does a designer do?', created_at: '2026-09-13T10:00:00Z' };
const onOpen = vi.fn(), onDelete = vi.fn(), onBusy = vi.fn();
const mount = () => render(<AdvisorHistory disabled={false} onOpen={onOpen} onDelete={onDelete} onBusy={onBusy} />);
beforeEach(() => { vi.resetAllMocks(); listCareerHistoryApi.mockResolvedValue({ items: [item], has_more: false }); });
afterEach(cleanup);

it('loads only when opened and reopens the saved answer without generating a new one', async () => {
  getCareerHistoryApi.mockResolvedValue({ id: item.id, response: { answer: 'Saved answer' } });
  mount(); expect(listCareerHistoryApi).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Previous questions' }));
  fireEvent.click(await screen.findByRole('button', { name: /^What does a designer do\?/ }));
  await waitFor(() => expect(onOpen).toHaveBeenCalledWith({ id: item.id, response: { answer: 'Saved answer' } }));
});

it('requires an explicit delete action and refreshes the list', async () => {
  deleteCareerHistoryApi.mockResolvedValue(); mount();
  fireEvent.click(screen.getByRole('button', { name: 'Previous questions' }));
  fireEvent.click(await screen.findByRole('button', { name: `Delete saved question: ${item.question}` }));
  expect(deleteCareerHistoryApi).not.toHaveBeenCalled();
  listCareerHistoryApi.mockResolvedValue({ items: [], has_more: false });
  fireEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));
  expect(await screen.findByText(/No saved answers yet/)).toBeTruthy();
  expect(onDelete).toHaveBeenCalledWith(item.id);
});

it('offers retry after history fails and aborts requests when leaving', async () => {
  listCareerHistoryApi.mockRejectedValueOnce(new Error('offline'));
  const view = mount(); fireEvent.click(screen.getByRole('button', { name: 'Previous questions' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  listCareerHistoryApi.mockReturnValue(new Promise(() => {}));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  const signal = listCareerHistoryApi.mock.calls[1][1].signal;
  view.unmount(); expect(signal.aborted).toBe(true);
});
