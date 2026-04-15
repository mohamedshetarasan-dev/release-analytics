import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import DashboardPage from '../../src/pages/DashboardPage';
import type { Release, ReleaseMetrics } from '../../src/types';
import { useAppStore } from '../../src/store';

const mockReleases: Release[] = [
  { id: 'r1', version: '3.20.1', name: null, status: 'completed', createdAt: Date.now() },
];

const mockMetrics: ReleaseMetrics[] = [
  {
    releaseVersion: '3.20.1',
    totalBugs: 8,
    bugsByState: { Active: 3, Resolved: 5 },
    avgBugResolutionDays: 3.5,
    releaseDurationDays: 42,
    plannedHours: 100,
    actualHours: 115,
    effortVariancePercent: 15,
    storyPoints: 30,
  },
];

const server = setupServer(
  http.get('/api/v1/releases', () => HttpResponse.json(mockReleases)),
  http.get('/api/v1/releases/compare', () => HttpResponse.json(mockMetrics)),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useAppStore.setState({ selectedReleaseIds: [] });
});
afterAll(() => server.close());

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('DashboardPage', () => {
  it('renders the heading', () => {
    render(<DashboardPage />, { wrapper });
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  it('shows empty state prompt when no releases selected', () => {
    render(<DashboardPage />, { wrapper });
    expect(screen.getByText(/select a release above/i)).toBeTruthy();
  });

  it('shows release selector', async () => {
    render(<DashboardPage />, { wrapper });
    expect(await screen.findByText('3.20.1')).toBeTruthy();
  });

  it('shows metrics when releases are selected', async () => {
    useAppStore.setState({ selectedReleaseIds: ['r1'] });
    render(<DashboardPage />, { wrapper });
    expect(await screen.findByText('Total Bugs')).toBeTruthy();
    expect(await screen.findByText('8')).toBeTruthy();
  });
});
