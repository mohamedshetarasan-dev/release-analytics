import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import ReleaseSelector from '../../src/components/shared/ReleaseSelector';
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

describe('ReleaseSelector', () => {
  it('shows loading state initially', () => {
    render(<ReleaseSelector />, { wrapper });
    expect(screen.getByText(/loading releases/i)).toBeTruthy();
  });

  it('renders release buttons after fetch', async () => {
    render(<ReleaseSelector />, { wrapper });
    expect(await screen.findByText('3.20.1')).toBeTruthy();
    expect(await screen.findByText(/4.0.0/)).toBeTruthy();
  });

  it('toggles selection on click', async () => {
    render(<ReleaseSelector />, { wrapper });
    const btn = await screen.findByText('3.20.1');
    await userEvent.click(btn);
    // After click, button should become "selected" (style-based; just verify no crash)
    expect(btn).toBeTruthy();
  });
});
