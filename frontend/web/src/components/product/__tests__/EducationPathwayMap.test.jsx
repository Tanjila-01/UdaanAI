import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EducationPathwayMap, { STRUCTURAL_NODES } from '../EducationPathwayMap';

describe('EducationPathwayMap Progressive Reveal & Interactive Visualization', () => {
  it('initially displays only Stage 0 (Class 10 / SSLC) and the three Stage 1 routes, keeping Stage 2 hidden', () => {
    render(<EducationPathwayMap selectedNodeId="c10" />);

    // Instruction is visible
    expect(screen.getByText('Select a route to explore your next steps.')).toBeTruthy();

    // Stage 0 and Stage 1 column headers are visible
    expect(screen.getByText('STAGE 0 • FOUNDATION')).toBeTruthy();
    expect(screen.getByText('STAGE 1 • MAIN ROUTES')).toBeTruthy();

    // Stage 2 header is NOT visible
    expect(screen.queryByText(/STAGE 2/i)).toBeNull();

    // Stage 0 root is visible
    expect(screen.getByRole('button', { name: /Explore Class 10 \/ SSLC/i })).toBeTruthy();

    // Stage 1 routes are visible
    expect(screen.getByRole('button', { name: /Explore PUC \(11th & 12th\)/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Explore Polytechnic Diploma/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Explore ITI Vocational Trades/i })).toBeTruthy();

    // Stage 2 streams and families are NOT visible initially
    expect(screen.queryByText('Science Stream')).toBeNull();
    expect(screen.queryByText('Commerce Stream')).toBeNull();
    expect(screen.queryByText('Arts & Humanities')).toBeNull();
    expect(screen.queryByText('Computing & Digital')).toBeNull();
    expect(screen.queryByText('Electrical ITI Trades')).toBeNull();
  });

  it('reveals PUC Stage 2 options (Science, Commerce, Arts) when PUC is clicked', () => {
    const onSelectNode = vi.fn();
    render(<EducationPathwayMap selectedNodeId="c10" onSelectNode={onSelectNode} />);

    // Click on PUC
    const pucNode = screen.getByRole('button', { name: /Explore PUC \(11th & 12th\)/i });
    fireEvent.click(pucNode);

    expect(onSelectNode).toHaveBeenCalledWith('puc');

    // Stage 2 header appears
    expect(screen.getByText('STAGE 2 • PUC STREAMS')).toBeTruthy();

    // PUC immediate children are revealed
    expect(screen.getByText('Science Stream')).toBeTruthy();
    expect(screen.getByText('Commerce Stream')).toBeTruthy();
    expect(screen.getByText('Arts & Humanities')).toBeTruthy();

    // Other branch children remain hidden
    expect(screen.queryByText('Computing & Digital')).toBeNull();
    expect(screen.queryByText('Electrical ITI Trades')).toBeNull();
  });

  it('replaces options with Polytechnic Diploma stream families when Diploma is clicked', () => {
    const onSelectNode = vi.fn();
    render(<EducationPathwayMap selectedNodeId="puc" onSelectNode={onSelectNode} />);

    // Initially PUC is open
    expect(screen.getByText('Science Stream')).toBeTruthy();

    // Click Polytechnic Diploma
    const diplomaNode = screen.getByRole('button', { name: /Explore Polytechnic Diploma/i });
    fireEvent.click(diplomaNode);

    expect(onSelectNode).toHaveBeenCalledWith('diploma');

    // PUC children are cleared
    expect(screen.queryByText('Science Stream')).toBeNull();
    expect(screen.queryByText('Commerce Stream')).toBeNull();
    expect(screen.queryByText('Arts & Humanities')).toBeNull();

    // Diploma stream families appear
    expect(screen.getByText('STAGE 2 • DIPLOMA FAMILIES')).toBeTruthy();
    expect(screen.getByText('Computing & Digital')).toBeTruthy();
    expect(screen.getByText('Electrical & Electronics')).toBeTruthy();
    expect(screen.getByText('Mechanical & Auto')).toBeTruthy();
    expect(screen.getByText('Civil & Infrastructure')).toBeTruthy();
  });

  it('displays only corresponding trade families when ITI Vocational Trades is clicked', () => {
    const onSelectNode = vi.fn();
    render(<EducationPathwayMap selectedNodeId="c10" onSelectNode={onSelectNode} />);

    // Click ITI Vocational Trades
    const itiNode = screen.getByRole('button', { name: /Explore ITI Vocational Trades/i });
    fireEvent.click(itiNode);

    expect(onSelectNode).toHaveBeenCalledWith('iti');

    // Stage 2 header appears
    expect(screen.getByText('STAGE 2 • VOCATIONAL TRADES')).toBeTruthy();

    // ITI trade families appear
    expect(screen.getByText('Electrical ITI Trades')).toBeTruthy();
    expect(screen.getByText('Mechanical & Fitter')).toBeTruthy();
    expect(screen.getByText('COPA & Office ITI')).toBeTruthy();

    // PUC and Diploma options are not shown
    expect(screen.queryByText('Science Stream')).toBeNull();
    expect(screen.queryByText('Computing & Digital')).toBeNull();
  });

  it('collapses Stage 2 back to initial foundation view when Class 10 is clicked', () => {
    const onSelectNode = vi.fn();
    render(<EducationPathwayMap selectedNodeId="puc" onSelectNode={onSelectNode} />);

    // PUC options are currently visible
    expect(screen.getByText('Science Stream')).toBeTruthy();

    // Click Class 10 / SSLC
    const c10Node = screen.getByRole('button', { name: /Explore Class 10 \/ SSLC/i });
    fireEvent.click(c10Node);

    expect(onSelectNode).toHaveBeenCalledWith('c10');

    // Stage 2 collapses and heading hides
    expect(screen.queryByText(/STAGE 2/i)).toBeNull();
    expect(screen.queryByText('Science Stream')).toBeNull();
    expect(screen.queryByText('Commerce Stream')).toBeNull();

    // Stage 1 routes are still visible
    expect(screen.getByRole('button', { name: /Explore PUC \(11th & 12th\)/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Explore Polytechnic Diploma/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Explore ITI Vocational Trades/i })).toBeTruthy();
  });

  it('Center View button does not collapse expanded branches', () => {
    render(<EducationPathwayMap selectedNodeId="puc" />);

    // PUC options are visible
    expect(screen.getByText('Science Stream')).toBeTruthy();

    // Click Center View
    const centerBtn = screen.getByRole('button', { name: /Center View/i });
    fireEvent.click(centerBtn);

    // PUC options MUST remain visible and not collapse
    expect(screen.getByText('Science Stream')).toBeTruthy();
    expect(screen.getByText('STAGE 2 • PUC STREAMS')).toBeTruthy();
  });

  it('supports keyboard navigation via Enter and Space keys', () => {
    const onSelectNode = vi.fn();
    render(<EducationPathwayMap selectedNodeId="c10" onSelectNode={onSelectNode} />);

    const pucNode = screen.getByRole('button', { name: /Explore PUC \(11th & 12th\)/i });

    // Press Enter
    fireEvent.keyDown(pucNode, { key: 'Enter' });
    expect(onSelectNode).toHaveBeenCalledWith('puc');

    // Press Space
    const diplomaNode = screen.getByRole('button', { name: /Explore Polytechnic Diploma/i });
    fireEvent.keyDown(diplomaNode, { key: ' ' });
    expect(onSelectNode).toHaveBeenCalledWith('diploma');
  });
});
