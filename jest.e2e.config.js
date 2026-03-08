/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/test'],
  testMatch: ['**/e2e.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
