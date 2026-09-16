import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContactPage from '../ContactPage';
import * as apiClient from '../../api/client';
import * as authContext from '../../context/AuthContext';

// Mock API client
vi.mock('../../api/client', () => ({
  submitContactInquiryApi: vi.fn(),
  submitWorkshopRequestApi: vi.fn(),
}));

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

// Mock scroll
window.scrollTo = vi.fn();

window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('ContactPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authContext.useAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      logout: vi.fn(),
    });
  });

  it('renders ContactPage with heading and two distinct pathways (Institutional vs General)', () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <ContactPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Get in Touch/i, level: 1 })).toBeTruthy();
    expect(screen.getByText(/Request an Institutional Workshop/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Send Us a Message/i })).toBeTruthy();
    expect(screen.getByText(/Your details are used only to respond to your enquiry\./i)).toBeTruthy();
  });

  it('enforces validation on empty form submission', async () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <ContactPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Name is required.')).toBeTruthy();
    expect(screen.getByText('Email is required.')).toBeTruthy();
    expect(screen.getByText('Subject is required.')).toBeTruthy();
    expect(screen.getByText('Message is required.')).toBeTruthy();

    expect(apiClient.submitContactInquiryApi).not.toHaveBeenCalled();
  });

  it('rejects invalid email and insufficient lengths', async () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <ContactPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Hi' } });
    fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: 'Short' } });

    const submitBtn = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Name must be at least 2 characters.')).toBeTruthy();
    expect(screen.getByText('Please provide a valid email address.')).toBeTruthy();
    expect(screen.getByText('Subject must be at least 3 characters.')).toBeTruthy();
    expect(screen.getByText('Message must be at least 10 characters.')).toBeTruthy();

    expect(apiClient.submitContactInquiryApi).not.toHaveBeenCalled();
  });

  it('submits valid form successfully, shows confirmation, and clears inputs', async () => {
    apiClient.submitContactInquiryApi.mockResolvedValueOnce({
      id: 'mock-inquiry-uuid',
      status: 'RECEIVED',
      message: 'Your enquiry has been received.',
      created_at: new Date().toISOString(),
    });

    render(
      <MemoryRouter initialEntries={['/contact']}>
        <ContactPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: 'Ramesh Gowda' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'ramesh@example.com' } });
    fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'Inquiry on Polytechnic Admissions' } });
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: 'I would like to inquire about the diploma lateral entry timeline for Karnataka students.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.submitContactInquiryApi).toHaveBeenCalledWith({
        name: 'Ramesh Gowda',
        email: 'ramesh@example.com',
        subject: 'Inquiry on Polytechnic Admissions',
        message: 'I would like to inquire about the diploma lateral entry timeline for Karnataka students.',
      });
    });

    expect(await screen.findByText('Message Received!')).toBeTruthy();
    expect(screen.getByText(/Your enquiry has been received and safely stored\./i)).toBeTruthy();

    // Inputs should be cleared
    expect(screen.getByLabelText(/Your Name/i).value).toBe('');
    expect(screen.getByLabelText(/Email Address/i).value).toBe('');
    expect(screen.getByLabelText(/Subject/i).value).toBe('');
    expect(screen.getByLabelText(/Message/i).value).toBe('');
  });

  it('preserves entered form data and shows error on submission failure', async () => {
    apiClient.submitContactInquiryApi.mockRejectedValueOnce({
      response: {
        status: 500,
        data: { detail: 'Database connection error. Please try again.' },
      },
    });

    render(
      <MemoryRouter initialEntries={['/contact']}>
        <ContactPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: 'Preethi Rao' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'preethi@example.com' } });
    fireEvent.change(screen.getByLabelText(/Subject/i), { target: { value: 'PUC Commerce Combinations' } });
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: 'What are the best degree options after CEBA in Karnataka universities?' },
    });

    const submitBtn = screen.getByRole('button', { name: /Send Message/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Submission Failed')).toBeTruthy();
    expect(screen.getByText('Database connection error. Please try again.')).toBeTruthy();

    // Verify entered data is preserved
    expect(screen.getByLabelText(/Your Name/i).value).toBe('Preethi Rao');
    expect(screen.getByLabelText(/Email Address/i).value).toBe('preethi@example.com');
    expect(screen.getByLabelText(/Subject/i).value).toBe('PUC Commerce Combinations');
    expect(screen.getByLabelText(/Message/i).value).toBe(
      'What are the best degree options after CEBA in Karnataka universities?'
    );
  });

  it('opens institutional workshop modal when clicking school workshop CTA', async () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <ContactPage />
      </MemoryRouter>
    );

    const schoolWorkshopBtn = screen.getByRole('button', { name: /Request a School Workshop/i });
    fireEvent.click(schoolWorkshopBtn);

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByText('1. Institution Information')).toBeTruthy();
  });
});
