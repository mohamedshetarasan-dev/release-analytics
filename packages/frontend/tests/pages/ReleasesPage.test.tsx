import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import ReleasesPage from '../../src/pages/ReleasesPage';
import type { Release } from '../../src/types';

const mockReleases: Release[] = [
  { id: 'r1', version: '3.20.1', name: null, status: 'completed', createdAt: Date.now() },
  { id: 'r2', version: '4.0.0', name: 'Sprint Q1', status: 'active', createdAt: Date.now() },
];

const server = setupServer(
  http.get('/api/v1/releases', () => HttpResponse.json(mockReleases)),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('ReleasesPage', () => {
  it('renders the heading', () => {
    render(<ReleasesPage />, { wrapper });
    expect(screen.getByText('Releases')).toBeTruthy();
  });

  it('shows loading initially', () => {
    render(<ReleasesPage />, { wrapper });
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('shows releases after fetch', async () => {
    render(<ReleasesPage />, { wrapper });
    expect(await screen.findByText('3.20.1')).toBeTruthy();
    expect(await screen.findByText('4.0.0')).toBeTruthy();
  });

  it('shows status badge', async () => {
    render(<ReleasesPage />, { wrapper });
    expect(await screen.findByText('completed')).toBeTruthy();
    expect(await screen.findByText('active')).toBeTruthy();
  });

  it('shows empty message when no releases', async () => {
    server.use(http.get('/api/v1/releases', () => HttpResponse.json([])));
    render(<ReleasesPage />, { wrapper });
    expect(await screen.findByText(/no releases yet/i)).toBeTruthy();
  });
});
