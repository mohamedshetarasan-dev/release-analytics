/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/app.ts'],
  coverageThreshold: {
    global: { lines: 80, branches: 65, functions: 80, statements: 80 },
  },
  coverageDirectory: 'coverage',
};

module.exports = config;
