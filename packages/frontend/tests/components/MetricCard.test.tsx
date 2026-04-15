import { render, screen } from '@testing-library/react';
import MetricCard from '../../src/components/shared/MetricCard';

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Total Bugs" value={42} />);
    expect(screen.getByText('Total Bugs')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('renders N/A when value is null', () => {
    render(<MetricCard label="Resolution Time" value={null} />);
    expect(screen.getByText('N/A')).toBeTruthy();
  });

  it('renders unit next to value', () => {
    render(<MetricCard label="Duration" value={14} unit="days" />);
    expect(screen.getByText('14')).toBeTruthy();
    expect(screen.getByText('days')).toBeTruthy();
  });

  it('renders subtitle text', () => {
    render(<MetricCard label="Effort" value={100} unit="hrs" subtitle="SLA breach" />);
    expect(screen.getByText('SLA breach')).toBeTruthy();
  });

  it('does not show unit when value is null', () => {
    render(<MetricCard label="Duration" value={null} unit="days" />);
    expect(screen.queryByText('days')).toBeNull();
  });
});
