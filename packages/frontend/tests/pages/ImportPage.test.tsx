import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ImportPage from '../../src/pages/ImportPage';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ImportPage', () => {
  it('renders the page heading', () => {
    render(<ImportPage />, { wrapper });
    expect(screen.getByText('Import Data')).toBeTruthy();
  });

  it('renders the file uploader', () => {
    render(<ImportPage />, { wrapper });
    expect(screen.getByText(/drag & drop/i)).toBeTruthy();
  });

  it('renders instructions about file types', () => {
    render(<ImportPage />, { wrapper });
    expect(screen.getAllByText(/\.csv/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\.xlsx/).length).toBeGreaterThan(0);
  });
});
