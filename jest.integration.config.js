const unitConfig = require("./jest.config.js");

// 로컬 Supabase에 붙는 테스트만 집는다. 나머지는 jest.config.js가 맡는다.
/** @type {import('jest').Config} */
module.exports = {
  ...unitConfig,
  testMatch: ["<rootDir>/src/**/__tests__/**/*.integration.test.ts"],
};
