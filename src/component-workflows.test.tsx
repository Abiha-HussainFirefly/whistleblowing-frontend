import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}));

vi.mock('axios', () => ({
  default: {
    create: () => apiMock,
    isAxiosError: () => false,
  },
}));

import { App } from './App';
import { CaseParityTools } from './case-parity-tools';
import { EnrichedReport } from './enriched-report';
import { InternalAttachments } from './attachments';
import { ManualIntakePage } from './manual-intake';
import { OversightPageFull } from './oversight-page';

function routed(element: React.ReactElement, path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  apiMock.get.mockResolvedValue({ data: {} });
  apiMock.post.mockResolvedValue({ data: { id: 'new-case', token: 'reporter-token' } });
  apiMock.patch.mockResolvedValue({ data: {} });
  apiMock.delete.mockResolvedValue({ data: {} });
  vi.spyOn(window, 'confirm').mockReturnValue(false);
});

describe('Whistleblowing React workflows', () => {
  it('renders the real internal attachment empty state and permission-gated upload control', () => {
    const { rerender } = render(<InternalAttachments caseId="case-1" items={[]} canUpload={false} />);
    expect(screen.getByText('No evidence has been added.')).toBeInTheDocument();
    expect(screen.queryByText('Upload evidence')).not.toBeInTheDocument();

    rerender(<InternalAttachments caseId="case-1" items={[]} canUpload />);
    expect(screen.getByText('Upload evidence')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload evidence' })).toBeEnabled();
  });

  it('renders the real participant editor and supports edit/remove permission controls', () => {
    render(
      <CaseParityTools
        caseId="case-1"
        enabled
        participants={[{ id: 'participant-1', fullName: 'A Person', role: 'WITNESS' }]}
        relatedCaseIds={[]}
        caseData={{ caseType: 'ALLEGATION' }}
      />,
    );

    expect(screen.getByText('A Person')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit participant' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(window.confirm).toHaveBeenCalledWith('Remove this participant?');
    expect(apiMock.delete).not.toHaveBeenCalled();
  });

  it('renders structured public reporting and named-reporter controls', async () => {
    apiMock.get.mockResolvedValue({
      data: {
        categories: ['FRAUD'],
        regions: [{ regionCode: 'EU', displayName: 'Europe' }],
        complianceTeam: [{ id: 'reviewer-1', displayName: 'Reviewer', canExclude: true }],
      },
    });
    routed(
      <Routes>
        <Route path="/report/:slug" element={<EnrichedReport />} />
      </Routes>,
      '/report/acme',
    );
    expect(await screen.findByText('Report a concern')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'FRAUD' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add a person' }));
    expect(screen.getByPlaceholderText('First name')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('I want to share my identity'));
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByText('Route to independent review')).toBeInTheDocument();
  });

  it('renders manual intake loading-free form and structured people editor', () => {
    routed(<ManualIntakePage />, '/cases/new');
    expect(screen.getByRole('heading', { name: 'Manual intake' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add person' }));
    expect(screen.getByPlaceholderText('First name')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.queryByPlaceholderText('First name')).not.toBeInTheDocument();
  });

  it('renders live oversight data and the empty state from real API responses', async () => {
    apiMock.get.mockImplementation((url: string) => {
      if (url.endsWith('/stats')) return Promise.resolve({ data: { total: 2, open: 1, underInvestigation: 1, escalated: 0, closed: 0, anonymousCount: 1, namedCount: 1, avgResolutionDays: null, byStatus: {}, byCategory: {}, byPriority: {}, submissionsByMonth: [] } });
      if (url.endsWith('/regions')) return Promise.resolve({ data: { regions: [] } });
      return Promise.resolve({ data: { data: [], meta: { total: 0, page: 1, pageSize: 100, totalPages: 1 } } });
    });
    localStorage.setItem('wb.organizationId', 'org-1');
    routed(<OversightPageFull />, '/oversight');
    expect(await screen.findByText('Whistleblowing oversight')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Case register/ }));
    expect(screen.getByText('No oversight cases are visible.')).toBeInTheDocument();
  });

  it('renders actual application notification and analytics states through App routes', async () => {
    localStorage.setItem('wb.internalToken', 'internal-token');
    localStorage.setItem('wb.permissions', JSON.stringify(['whistleblowing_case:read']));
    apiMock.get.mockImplementation((url: string) => {
      if (url === '/whistleblowing/notifications') return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: { total: 0, open: 0, underInvestigation: 0, escalated: 0, closed: 0, anonymousCount: 0, namedCount: 0, slaBreached: 0, slaAtRisk: 0, avgResolutionDays: null, byStatus: {}, byPriority: {}, byCategory: {}, submissionsByMonth: [] } });
    });
    routed(<App />, '/notifications');
    expect(await screen.findByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('No notifications yet.')).toBeInTheDocument();
    expect(apiMock.get).toHaveBeenCalledWith('/whistleblowing/notifications', expect.any(Object));

    render(
      <MemoryRouter initialEntries={['/whistleblowing']}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Case overview')).toBeInTheDocument());
    expect(screen.getByText('TOTAL REPORTS')).toBeInTheDocument();
  });

  it('renders the Tellara landing and real auth routes', () => {
    routed(<App />, '/');
    // The landing page must position Tellara as a protected speak-up channel.
    expect(screen.getByRole('heading', { name: /Speak safely\. Stay heard\./ })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/auth/login');
    // Raising a concern must never be gated behind the staff sign-in.
    expect(screen.getByRole('link', { name: /Raise a concern/ })).toBeInTheDocument();

    cleanup();
    routed(<App />, '/auth/login');
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeRequired();

    cleanup();
    routed(<App />, '/auth/org/login');
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeRequired();

    cleanup();
    routed(<App />, '/auth/signup');
    expect(screen.getByRole('heading', { name: 'Create your Tellara organization' })).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeRequired();
  });

  it('renders the real case-register row and notification error state', async () => {
    localStorage.setItem('wb.internalToken', 'internal-token');
    localStorage.setItem('wb.permissions', JSON.stringify(['whistleblowing_case:read']));
    apiMock.get.mockImplementation((url: string) => {
      if (url === '/whistleblowing/cases') {
        return Promise.resolve({ data: { data: [{ id: 'case-1', caseReferenceNumber: 'WB-001', category: 'FRAUD', status: 'SUBMITTED', priority: 'PRIORITY_MEDIUM', isAnonymous: true, reporterAlias: 'Reporter-1', submittedAt: '2026-01-01T00:00:00Z', slaDeadline: null, slaBreachedAt: null }], meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 } } });
      }
      return Promise.reject(new Error('backend unavailable'));
    });
    routed(<App />, '/cases');
    expect(await screen.findByText('WB-001')).toBeInTheDocument();

    routed(<App />, '/notifications');
    expect(await screen.findByText('Request failed.')).toBeInTheDocument();
  });
});
