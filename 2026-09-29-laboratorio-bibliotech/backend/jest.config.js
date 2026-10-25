/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/model/entities/**/*.ts',
    'src/model/validators/**/*.ts',
    'src/model/services/**/*.ts',
    'src/model/errors.ts',
    'src/controller/guards/**/*.ts',
    'src/controller/filters/**/*.ts',
    'src/infrastructure/security/**/*.ts',
    'src/infrastructure/storage/**/*.ts',
    '!src/**/*.module.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      lines: 80,
      statements: 75,
      functions: 80,
      branches: 70,
    },
  },
};
