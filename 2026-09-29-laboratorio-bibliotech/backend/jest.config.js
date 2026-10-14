module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/test/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: './coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/frameworks/main.ts', '!src/usecases/ports.ts'],
  // Gate `make check`: solo capas testeables sin DB (GAP-002 excluye
  // persistence/typeorm, storage y app.module hasta el port DB-backed;
  // ports.ts es solo tipos + re-export, sin comportamiento que cubrir).
  coverageThreshold: {
    './src/entities/**/*.ts': { lines: 80, branches: 70 },
    './src/usecases/**/*.ts': { lines: 85, branches: 80 },
    './src/adapters/http/**/*.ts': { lines: 80, branches: 60 },
    './src/adapters/validators/**/*.ts': { lines: 85, branches: 80 },
    './src/frameworks/security/**/*.ts': { lines: 90, branches: 90 },
  },
};
