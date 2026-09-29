import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CareerAnswerRenderer, { normalizeAnswerText, parseMarkdownBlocks } from '../CareerAnswerRenderer';

describe('CareerAnswerRenderer', () => {
  it('cleans escaped HTML tags and converts them to readable markdown', () => {
    const raw = 'Skills:\\<ul>\\<li>Python\\</li>\\<li>Problem Solving\\</li>\\</ul><br>Great work!';
    const cleaned = normalizeAnswerText(raw);
    expect(cleaned).not.toContain('\\<ul>');
    expect(cleaned).not.toContain('\\<li>');
    expect(cleaned).toContain('- Python');
    expect(cleaned).toContain('- Problem Solving');
    expect(cleaned).toContain('Great work!');
  });

  it('renders markdown headings with proper hierarchy', () => {
    const markdown = '## What a Developer Does\n### Key Skills\nLearn coding.';
    render(<CareerAnswerRenderer content={markdown} />);
    
    expect(screen.getByRole('heading', { level: 3, name: 'What a Developer Does' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: 'Key Skills' })).toBeTruthy();
    expect(screen.getByText('Learn coding.')).toBeTruthy();
  });

  it('renders unordered and ordered lists with custom bullet styling', () => {
    const markdown = '- Understand requirements\n- Write clean code\n- Test features\n\n1. Complete Class 10\n2. Enroll in Diploma or PUC';
    render(<CareerAnswerRenderer content={markdown} />);

    expect(screen.getByText('Understand requirements')).toBeTruthy();
    expect(screen.getByText('Write clean code')).toBeTruthy();
    expect(screen.getByText('Test features')).toBeTruthy();
    expect(screen.getByText('Complete Class 10')).toBeTruthy();
    expect(screen.getByText('Enroll in Diploma or PUC')).toBeTruthy();
  });

  it('renders markdown tables in a responsive container with styled headers and cells', () => {
    const markdown = '| Role | Education | Growth |\n|---|---|---|\n| **Software Dev** | B.Tech / Diploma | High |\n| **Electrician** | ITI / Apprenticeship | Steady |';
    const { container } = render(<CareerAnswerRenderer content={markdown} />);

    expect(container.querySelector('.advisor-table-wrap')).toBeTruthy();
    expect(container.querySelector('.advisor-table')).toBeTruthy();
    expect(screen.getByText('Role')).toBeTruthy();
    expect(screen.getByText('Education')).toBeTruthy();
    expect(screen.getByText('Growth')).toBeTruthy();
    expect(screen.getByText('Software Dev')).toBeTruthy();
    expect(screen.getByText('B.Tech / Diploma')).toBeTruthy();
  });

  it('renders blockquotes properly without raw angle brackets', () => {
    const markdown = '> "Curiosity is the best foundation for learning."';
    const { container } = render(<CareerAnswerRenderer content={markdown} />);

    expect(container.querySelector('.advisor-answer-quote')).toBeTruthy();
    expect(screen.getByText('"Curiosity is the best foundation for learning."')).toBeTruthy();
  });

  it('renders bold, italic, code, and safe links', () => {
    const markdown = 'Learn **Python** and *JavaScript* with `console.log()` at [Codecademy](https://www.codecademy.com).';
    const { container } = render(<CareerAnswerRenderer content={markdown} />);

    const bold = container.querySelector('strong');
    expect(bold.textContent).toBe('Python');
    const italic = container.querySelector('em');
    expect(italic.textContent).toBe('JavaScript');
    const code = container.querySelector('code');
    expect(code.textContent).toBe('console.log()');
    const link = screen.getByRole('link', { name: 'Codecademy' });
    expect(link.getAttribute('href')).toBe('https://www.codecademy.com');
  });

  it('safely handles empty or whitespace input', () => {
    const { container } = render(<CareerAnswerRenderer content="   " />);
    expect(container.firstChild).toBeNull();
  });
});
