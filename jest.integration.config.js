const unitConfig = require("./jest.config.js");

// 로컬 Supabase에 붙는 테스트만 집는다. 나머지는 jest.config.js가 맡는다.
/** @type {import('jest').Config} */
module.exports = {
  ...unitConfig,
  testMatch: ["<rootDir>/src/**/__tests__/**/*.integration.test.ts"],
  // 파일 하나씩 돈다. 전부 같은 로컬 DB를 보는데 홀 하나에 행 하나인 표(halls·hall_secrets)가
  // 있어서, 다른 파일이 같은 행을 동시에 덮으면 서로의 단언이 깨진다.
  maxWorkers: 1,
};
