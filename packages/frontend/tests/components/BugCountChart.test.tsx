import { render } from '@testing-library/react';
import BugCountChart from '../../src/components/charts/BugCountChart';
import type { ReleaseMetrics } from '../../src/types';

const mockData: ReleaseMetrics[] = [
  {
    releaseVersion: '3.20.1',
    totalBugs: 10,
    bugsByState: { Active: 3, Resolved: 5, Closed: 2 },
    avgBugResolutionDays: 3.5,
    releaseDurationDays: 42,
    plannedHours: 100,
    actualHours: 115,
    effortVariancePercent: 15,
    storyPoints: 45,
  },
  {
    releaseVersion: '4.0.0',
    totalBugs: 6,
    bugsByState: { Active: 2, Resolved: 4 },
    avgBugResolutionDays: 2.1,
    releaseDurationDays: 30,
    plannedHours: 80,
    actualHours: 76,
    effortVariancePercent: -5,
    storyPoints: 30,
  },
];

describe('BugCountChart', () => {
  it('renders without crashing with data', () => {
    const { container } = render(<BugCountChart data={mockData} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders without crashing with empty data', () => {
    const { container } = render(<BugCountChart data={[]} />);
    expect(container.firstChild).toBeTruthy();
  });
});
