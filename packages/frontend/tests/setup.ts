import '@testing-library/jest-dom';

// jsdom doesn't implement ResizeObserver — mock it for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
