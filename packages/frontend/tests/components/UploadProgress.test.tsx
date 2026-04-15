import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadProgress from '../../src/components/upload/UploadProgress';
import type { ImportResult } from '../../src/types';

const mockResult: ImportResult = {
  jobId: 'job-1',
  rowsImported: 120,
  rowsSkipped: 5,
  rowsFailed: 2,
  errors: [{ row: 10, message: 'Missing release version' }],
};

describe('UploadProgress', () => {
  it('renders nothing when idle', () => {
    const { container } = render(
      <UploadProgress uploading={false} progress={0} result={null} error={null} onReset={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows progress bar while uploading', () => {
    render(
      <UploadProgress uploading={true} progress={60} result={null} error={null} onReset={() => {}} />,
    );
    expect(screen.getByText('60%')).toBeTruthy();
    expect(screen.getByText('Uploading…')).toBeTruthy();
  });

  it('shows error message on failure', () => {
    render(
      <UploadProgress uploading={false} progress={0} result={null} error="Server error" onReset={() => {}} />,
    );
    expect(screen.getByText(/Server error/)).toBeTruthy();
  });

  it('shows success summary on completion', () => {
    render(
      <UploadProgress uploading={false} progress={100} result={mockResult} error={null} onReset={() => {}} />,
    );
    expect(screen.getByText('120')).toBeTruthy();
    expect(screen.getByText('Import complete')).toBeTruthy();
  });

  it('calls onReset when "Import another file" is clicked', async () => {
    const onReset = vi.fn();
    render(
      <UploadProgress uploading={false} progress={100} result={mockResult} error={null} onReset={onReset} />,
    );
    await userEvent.click(screen.getByText('Import another file'));
    expect(onReset).toHaveBeenCalled();
  });
});
