const {
  getIOSPreset,
  getNodePreset,
} = require("jest-expo/config/getPlatformPreset");
const { resolveBabelOptions } = require("jest-expo/src/resolveBabelOptions");

const nodePreset = getNodePreset();
const iosPreset = getIOSPreset();

const SOURCE_TRANSFORM = "\\.[jt]sx?$";

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

// jest-expo의 플랫폼 프리셋은 babel-jest 옵션을 caller 하나로 덮어써서, babel.config.js가
// 없는 저장소에서는 preset이 통째로 빠진다. resolveBabelOptions가 고르는 값을 되돌려 놓는다.
//
// transformImportMeta는 import.meta를 globalThis.__ExpoImportMetaRegistry로 바꾼다.
// 그 레지스트리를 채우는 것은 Metro 런타임이라 Jest에서는 undefined다. 끄면 Jest가
// ESM 모듈에 직접 넣어주는 import.meta가 그대로 산다.
function babelOptionsOf(preset) {
  const [, platformBabelOptions] = preset.transform[SOURCE_TRANSFORM];

  return {
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
}

// `watchPlugins`는 프로젝트가 아니라 러너 전체가 받는 값이다. 프리셋이 얹어 놓은 것을
// 그대로 두면 갈래마다 「알 수 없는 옵션」 경고가 뜬다.
function withoutRunnerOnlyOptions(preset) {
  const { watchPlugins: _watchPlugins, ...rest } = preset;

  return rest;
}

function transformOf(preset) {
  const { [SOURCE_TRANSFORM]: _replaced, ...assetTransforms } =
    preset.transform;

  return {
    ...assetTransforms,
    "\\.[mc]?[jt]sx?$": ["babel-jest", babelOptionsOf(preset)],
  };
}

/**
 * 계산과 문서 검사가 도는 자리다. 프리셋이 `react-native`를 `react-native-web`으로 이어서
 * 네이티브 조각은 여기서 못 선다 — 조각은 아래 iOS 갈래가 받는다.
 */
const logic = {
  ...withoutRunnerOnlyOptions(nodePreset),
  rootDir: __dirname,
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.test.ts",
    "<rootDir>/src/**/__tests__/**/*.test.tsx",
    "<rootDir>/.claude/hooks/__tests__/**/*.test.ts",
    "<rootDir>/eslint-rules/__tests__/**/*.test.ts",
    "<rootDir>/tests/lint/**/*.test.ts",
    // integration은 로컬 Supabase가 떠 있어야 돈다. jest.integration.config.js가 그것만 집는다.
    "!**/*.integration.test.ts",
    "!**/src/shared/ui/__tests__/**",
  ],
  // scripts/*.mts는 최상위 await을 쓴다. CJS로 내리면 표현할 수 없어 Jest의 ESM 경로로
  // 돌린다 — NODE_OPTIONS=--experimental-vm-modules가 test 스크립트에 붙는 이유다.
  extensionsToTreatAsEsm: [".ts", ".mts"],
  moduleFileExtensions: ["mts", "mjs", ...nodePreset.moduleFileExtensions],
  transform: transformOf(nodePreset),
};

/**
 * 조각이 렌더되는 자리다. `@testing-library/react-native`는 진짜 `react-native`를 요구해서
 * node 프리셋의 web 대체 위에서는 질의 함수조차 안 돌아온다 — 그래서 iOS 프리셋으로 가른다.
 * 조각이 기본으로 넘기는 prop(글자 배율 상한·모션 값)만 보는 자리라 플랫폼은 한쪽이면 된다.
 */
const components = {
  ...withoutRunnerOnlyOptions(iosPreset),
  rootDir: __dirname,
  testMatch: ["<rootDir>/src/shared/ui/__tests__/**/*.test.tsx"],
  transform: transformOf(iosPreset),
  // Reanimated는 `lib/module`만 내고 그 옆 package.json이 `type: module`이라, Jest가 변환
  // 전에 ESM으로 갈라 `require`를 거부한다. 패키지가 같이 내놓는 CJS 대역으로 잇는다 —
  // 이 갈래가 보는 것은 조각이 넘기는 값이지 실제 애니메이션이 아니다.
  moduleNameMapper: {
    ...iosPreset.moduleNameMapper,
    "^react-native-reanimated$":
      require.resolve("react-native-reanimated/mock"),
    "^react-native-worklets$":
      require.resolve("react-native-worklets/src/mock.ts"),
  },
};

// 갈래를 여기서 내는 것은 integration 설정이 `logic`을 그대로 물려받기 때문이다.
// `jest.config.js`가 `projects`만 내보내면 그쪽이 스프레드로 가져갈 것이 없다.
module.exports = { logic, components };
