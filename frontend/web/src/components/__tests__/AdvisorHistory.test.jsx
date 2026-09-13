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

it('explains a single page and hides unnecessary page controls', async () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Previous questions' }));
  expect(await screen.findByText('All 1 saved answer shown.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Earlier answers' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'More recent answers' })).toBeNull();
});

it('moves between earlier and more recent pages using the correct offsets', async () => {
  listCareerHistoryApi.mockResolvedValueOnce({ items: Array.from({ length: 20 }, (_, i) => ({ ...item, id: `id-${i}` })), has_more: true })
    .mockResolvedValueOnce({ items: [{ ...item, id: 'older' }], has_more: false })
    .mockResolvedValueOnce({ items: [item], has_more: true });
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Previous questions' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Earlier answers' }));
  expect(await screen.findByText(/Showing 21 to 21/)).toBeTruthy();
  expect(listCareerHistoryApi.mock.calls[1][0]).toBe(20);
  fireEvent.click(screen.getByRole('button', { name: 'More recent answers' }));
  await waitFor(() => expect(listCareerHistoryApi.mock.calls[2][0]).toBe(0));
  expect(await screen.findByRole('button', { name: 'Earlier answers' })).toBeTruthy();
});
