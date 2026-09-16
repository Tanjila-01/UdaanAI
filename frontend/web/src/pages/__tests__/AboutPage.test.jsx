import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AboutPage from '../AboutPage';
import * as authContext from '../../context/AuthContext';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}));

// Mock scrollIntoView and scrollTo
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();


const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AboutPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authContext.useAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      logout: vi.fn(),
    });
  });

  it('renders AboutPage with correct heading, mission, and core values', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutPage />
      </MemoryRouter>
    );

    // Main heading
    expect(screen.getByRole('heading', { name: /Helping Students Find a Clearer Path Forward/i })).toBeTruthy();

    // Mission and Problem sections
    expect(screen.getByText(/Why Udaan AI Exists/i)).toBeTruthy();
    expect(screen.getByText(/How Udaan AI Helps/i)).toBeTruthy();
    expect(screen.getByText(/Meet the Founders/i)).toBeTruthy();
  });

  it('renders all four founders with correct names and roles', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutPage />
      </MemoryRouter>
    );

    // 1. Tanjila B
    expect(screen.getByText('Tanjila B')).toBeTruthy();
    expect(screen.getByText('Full Stack Developer')).toBeTruthy();

    // 2. Thanusha M H
    expect(screen.getByText('Thanusha M H')).toBeTruthy();
    expect(screen.getByText('Web Developer')).toBeTruthy();

    // 3. Priyanka M
    expect(screen.getByText('Priyanka M')).toBeTruthy();
    expect(screen.getByText('Frontend Developer')).toBeTruthy();

    // 4. M A Abbas
    expect(screen.getByText('M A Abbas')).toBeTruthy();
    expect(screen.getByText('UI/UX Designer')).toBeTruthy();
  });

  it('renders images with meaningful alt text for each founder', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutPage />
      </MemoryRouter>
    );

    const tanzImg = screen.getByAltText('Tanjila B, Full Stack Developer at Udaan AI');
    expect(tanzImg).toBeTruthy();
    expect(tanzImg.getAttribute('src')).toBeTruthy();

    const thanzzImg = screen.getByAltText('Thanusha M H, Web Developer at Udaan AI');
    expect(thanzzImg).toBeTruthy();

    const priiiImg = screen.getByAltText('Priyanka M, Frontend Developer at Udaan AI');
    expect(priiiImg).toBeTruthy();

    const ayyanImg = screen.getByAltText('M A Abbas, UI/UX Designer at Udaan AI');
    expect(ayyanImg).toBeTruthy();
  });

  it('renders social link only for verified profiles and never produces empty # anchors', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutPage />
      </MemoryRouter>
    );

    // Tanjila has verified GitHub
    const tanzGithub = screen.getByRole('link', { name: "Tanjila B's GitHub Profile" });
    expect(tanzGithub).toBeTruthy();
    expect(tanzGithub.getAttribute('href')).toBe('https://github.com/Tanjila-01');

    // No empty anchors or '#' links in the entire founder section
    const allLinks = screen.getAllByRole('link');
    allLinks.forEach((link) => {
      expect(link.getAttribute('href')).not.toBe('#');
      expect(link.getAttribute('href')).not.toBe('');
    });
  });

  it('navigates to login for logged-out visitors and advisor for authenticated students', () => {
    // 1. Guest
    const { unmount } = render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutPage />
      </MemoryRouter>
    );

    const talkBtn = screen.getByRole('button', { name: /Talk to Udaan AI/i });
    fireEvent.click(talkBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: '/student/ai-career' } });

    unmount();

    // 2. Student
    mockNavigate.mockClear();
    authContext.useAuth.mockReturnValue({
      user: { id: 's1', role: 'student' },
      profile: { is_complete: true },
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutPage />
      </MemoryRouter>
    );

    const studentTalkBtn = screen.getByRole('button', { name: /Talk to Udaan AI/i });
    fireEvent.click(studentTalkBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/student/ai-career');
  });

  it('provides primary CTA pointing back to /#pathways', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AboutPage />
      </MemoryRouter>
    );

    const pathwayLinks = screen.getAllByRole('link', { name: /Explore Karnataka Pathways/i });
    expect(pathwayLinks.length).toBeGreaterThanOrEqual(1);
    pathwayLinks.forEach((link) => {
      expect(link.getAttribute('href')).toBe('/#pathways');
    });
  });
});
