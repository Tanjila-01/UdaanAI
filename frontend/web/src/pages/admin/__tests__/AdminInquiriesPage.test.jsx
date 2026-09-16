import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminInquiriesPage from '../AdminInquiriesPage';
import * as apiClient from '../../../api/client';
import * as authContext from '../../../context/AuthContext';

// Mock API Client
vi.mock('../../../api/client', () => ({
  getAdminInquiriesApi: vi.fn(),
  updateAdminInquiryStatusApi: vi.fn(),
}));

// Mock AuthContext
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

// Mock scroll
window.scrollTo = vi.fn();

const mockInquiries = [
  {
    id: 'inq-1',
    name: 'Anand Kumar',
    email: 'anand@example.com',
    subject: 'PUC Science Lateral Entry Query',
    message: 'Can I shift to Polytechnic Diploma in 2nd year if I studied PCMB in 1st PUC?',
    status: 'NEW',
    created_at: '2026-09-15T10:30:00.000Z',
  },
  {
    id: 'inq-2',
    name: 'Deepa Hegde',
    email: 'deepa@example.com',
    subject: 'Workshop pricing clarification',
    message: 'How does your team coordinate school career awareness days?',
    status: 'CONTACTED',
    created_at: '2026-09-14T08:15:00.000Z',
  },
];

describe('AdminInquiriesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authContext.useAuth.mockReturnValue({
      user: { id: 'adm-1', role: 'admin' },
      profile: null,
      loading: false,
      logout: vi.fn(),
    });
    apiClient.getAdminInquiriesApi.mockResolvedValue(mockInquiries);
  });

  it('renders AdminInquiriesPage with header, metrics, search, and inquiries list', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/inquiries']}>
        <AdminInquiriesPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Contact Inquiries/i })).toBeTruthy();
    expect(screen.getByText('Live Submissions')).toBeTruthy();

    // Verify metrics
    expect(screen.getByText('Total Received')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy(); // total

    // Verify inquiry cards
    expect(screen.getByText('PUC Science Lateral Entry Query')).toBeTruthy();
    expect(screen.getByText('Anand Kumar')).toBeTruthy();
    expect(screen.getByText('anand@example.com')).toBeTruthy();
    expect(screen.getByText(/Can I shift to Polytechnic Diploma in 2nd year/i)).toBeTruthy();

    expect(screen.getByText('Workshop pricing clarification')).toBeTruthy();
    expect(screen.getByText('Deepa Hegde')).toBeTruthy();
  });

  it('filters inquiries when searching in the search box', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/inquiries']}>
        <AdminInquiriesPage />
      </MemoryRouter>
    );

    await screen.findByText('PUC Science Lateral Entry Query');

    const searchInput = screen.getByPlaceholderText(/Search by name, email, or subject.../i);
    fireEvent.change(searchInput, { target: { value: 'Deepa' } });

    expect(screen.getByText('Deepa Hegde')).toBeTruthy();
    expect(screen.queryByText('Anand Kumar')).toBeNull();
  });

  it('updates status when clicking status change button', async () => {
    apiClient.updateAdminInquiryStatusApi.mockResolvedValueOnce({
      ...mockInquiries[0],
      status: 'RESOLVED',
    });

    render(
      <MemoryRouter initialEntries={['/admin/inquiries']}>
        <AdminInquiriesPage />
      </MemoryRouter>
    );

    await screen.findByText('PUC Science Lateral Entry Query');

    const resolveBtn = screen.getAllByRole('button', { name: /Mark Resolved/i })[0];
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(apiClient.updateAdminInquiryStatusApi).toHaveBeenCalledWith('inq-1', 'RESOLVED');
    });
  });

  it('provides direct reply mailto action with connect.udaanai@gmail.com context', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/inquiries']}>
        <AdminInquiriesPage />
      </MemoryRouter>
    );

    await screen.findByText('PUC Science Lateral Entry Query');

    const replyLinks = screen.getAllByRole('link', { name: /Reply via connect.udaanai@gmail.com/i });
    expect(replyLinks.length).toBe(2);

    const firstReplyLink = replyLinks[0];
    expect(firstReplyLink.getAttribute('href')).toContain('mailto:anand@example.com');
    expect(firstReplyLink.getAttribute('href')).toContain('PUC%20Science%20Lateral%20Entry%20Query');
  });
});
