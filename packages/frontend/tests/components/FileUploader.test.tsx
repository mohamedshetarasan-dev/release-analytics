import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploader from '../../src/components/upload/FileUploader';

describe('FileUploader', () => {
  it('renders the drop zone with instructions', () => {
    render(<FileUploader onFile={() => {}} />);
    expect(screen.getByText(/drag & drop/i)).toBeTruthy();
    expect(screen.getByText(/\.csv, \.xlsx/i)).toBeTruthy();
  });

  it('calls onFile with a valid CSV file', async () => {
    const onFile = vi.fn();
    render(<FileUploader onFile={onFile} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['id,title'], 'export.csv', { type: 'text/csv' });

    await userEvent.upload(input, file);

    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('still renders the drop zone when disabled', () => {
    render(<FileUploader onFile={() => {}} disabled />);
    expect(screen.getByText(/drag & drop/i)).toBeTruthy();
  });
});
