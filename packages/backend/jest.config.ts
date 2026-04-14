import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/app.ts'],
  coverageThreshold: {
    global: { lines: 80, branches: 80 },
  },
  coverageDirectory: 'coverage',
};

export default config;
