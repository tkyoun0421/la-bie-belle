const { logic } = require("./jest.projects.js");

/** @type {import('jest').Config} */
module.exports = {
  ...logic,
  testMatch: ["<rootDir>/src/**/__tests__/**/*.integration.test.ts"],
  maxWorkers: 1,
};
