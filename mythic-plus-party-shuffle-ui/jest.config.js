const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/*.test.{ts,tsx}',
    '!app/**/__tests__/**',
    '!app/**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      statements: 12,
      branches: 7,
      functions: 15,
      lines: 12,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
