const { getNodePreset } = require("jest-expo/config/getPlatformPreset");
const { resolveBabelOptions } = require("jest-expo/src/resolveBabelOptions");

const nodePreset = getNodePreset();

// jest-expo의 플랫폼 프리셋은 babel-jest 옵션을 caller 하나로 덮어써서, babel.config.js가
// 없는 저장소에서는 preset이 통째로 빠진다. resolveBabelOptions가 고르는 값을 되돌려 놓는다.
const SOURCE_TRANSFORM = "\\.[jt]sx?$";
const [, platformBabelOptions] = nodePreset.transform[SOURCE_TRANSFORM];
const { [SOURCE_TRANSFORM]: _replaced, ...assetTransforms } =
  nodePreset.transform;

// babel-preset-expo의 TypeScript override는 파일 이름이 .ts·.tsx로 끝나는 것만 받는다.
// scripts/*.mts는 그 그물에 안 걸려 타입 구문이 문법 오류로 읽히니 같은 플러그인을 건다.
// test를 RegExp로 적으면 Jest가 워커로 설정을 넘길 때 JSON으로 눌려 사라진다. babel이
// 받아주는 glob 문자열로 적어야 워커에서도 같은 override가 산다.
const MODULE_TYPESCRIPT_OVERRIDE = {
  test: ["**/*.mts", "**/*.cts"],
  plugins: [
    [
      require.resolve("@babel/plugin-transform-typescript"),
      { isTSX: false, allowNamespaces: true },
    ],
  ],
};

// transformImportMeta는 import.meta를 globalThis.__ExpoImportMetaRegistry로 바꾼다.
// 그 레지스트리를 채우는 것은 Metro 런타임이라 Jest에서는 undefined다. 끄면 Jest가
// ESM 모듈에 직접 넣어주는 import.meta가 그대로 산다.
const BABEL_OPTIONS = {
  ...resolveBabelOptions(__dirname),
  ...platformBabelOptions,
  presets: [
    [
      require.resolve("expo/internal/babel-preset"),
      { transformImportMeta: false },
    ],
  ],
  overrides: [MODULE_TYPESCRIPT_OVERRIDE],
};

/** @type {import('jest').Config} */
module.exports = {
  ...nodePreset,
  rootDir: __dirname,
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.test.ts",
    "<rootDir>/src/**/__tests__/**/*.test.tsx",
    "<rootDir>/.claude/hooks/__tests__/**/*.test.ts",
    "<rootDir>/eslint-rules/__tests__/**/*.test.ts",
    "<rootDir>/tests/lint/**/*.test.ts",
    // integration은 로컬 Supabase가 떠 있어야 돈다. jest.integration.config.js가 그것만 집는다.
    "!**/*.integration.test.ts",
  ],
  // scripts/*.mts는 최상위 await을 쓴다. CJS로 내리면 표현할 수 없어 Jest의 ESM 경로로
  // 돌린다 — NODE_OPTIONS=--experimental-vm-modules가 test 스크립트에 붙는 이유다.
  extensionsToTreatAsEsm: [".ts", ".mts"],
  moduleFileExtensions: ["mts", "mjs", ...nodePreset.moduleFileExtensions],
  transform: {
    ...assetTransforms,
    "\\.[mc]?[jt]sx?$": ["babel-jest", BABEL_OPTIONS],
  },
};
