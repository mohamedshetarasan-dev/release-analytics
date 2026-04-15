import { render, screen } from '@testing-library/react';
import DataTable from '../../src/components/shared/DataTable';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'count', header: 'Count' },
];

const data = [
  { id: '1', name: 'Alpha', count: 10 },
  { id: '2', name: 'Beta', count: 20 },
];

describe('DataTable', () => {
  it('renders headers', () => {
    render(<DataTable columns={columns} data={data} rowKey={(r) => r.id} />);
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Count')).toBeTruthy();
  });

  it('renders row data', () => {
    render(<DataTable columns={columns} data={data} rowKey={(r) => r.id} />);
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
  });

  it('shows empty message when data is empty', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        rowKey={(r) => r.id}
        emptyMessage="Nothing here"
      />,
    );
    expect(screen.getByText('Nothing here')).toBeTruthy();
  });
});
