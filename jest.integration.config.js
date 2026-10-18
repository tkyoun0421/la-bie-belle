const { logic } = require("./jest.projects.js");

/** @type {import('jest').Config} */
module.exports = {
  ...logic,
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.integration.test.ts",
    "<rootDir>/tests/integration/__tests__/**/*.integration.test.ts",
  ],
  maxWorkers: 1,
  setupFilesAfterEnv: [
    ...logic.setupFilesAfterEnv,
    "<rootDir>/tests/setup/purgeTestUsers.ts",
  ],
  globalSetup: "<rootDir>/tests/integration/globalSetup.ts",
};
