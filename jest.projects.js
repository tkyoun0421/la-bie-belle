const {
  getIOSPreset,
  getNodePreset,
} = require("jest-expo/config/getPlatformPreset");
const { resolveBabelOptions } = require("jest-expo/src/resolveBabelOptions");

const nodePreset = getNodePreset();
const iosPreset = getIOSPreset();

const SOURCE_TRANSFORM = "\\.[jt]sx?$";

const MODULE_TYPESCRIPT_OVERRIDE = {
  test: ["**/*.mts", "**/*.cts"],
  plugins: [
    [
      require.resolve("@babel/plugin-transform-typescript"),
      { isTSX: false, allowNamespaces: true },
    ],
  ],
};

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

const logic = {
  ...withoutRunnerOnlyOptions(nodePreset),
  displayName: "logic",
  rootDir: __dirname,
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.test.ts",
    "<rootDir>/src/**/__tests__/**/*.test.tsx",
    "<rootDir>/.claude/hooks/__tests__/**/*.test.ts",
    "<rootDir>/eslint-rules/__tests__/**/*.test.ts",
    "<rootDir>/tests/lint/**/*.test.ts",
    "!**/*.integration.test.ts",
    "!**/src/shared/ui/__tests__/**",
  ],
  extensionsToTreatAsEsm: [".ts", ".mts"],
  moduleFileExtensions: ["mts", "mjs", ...nodePreset.moduleFileExtensions],
  transform: transformOf(nodePreset),
};

const components = {
  ...withoutRunnerOnlyOptions(iosPreset),
  displayName: "components",
  rootDir: __dirname,
  testMatch: ["<rootDir>/src/shared/ui/__tests__/**/*.test.tsx"],
  transform: transformOf(iosPreset),
  moduleNameMapper: {
    ...iosPreset.moduleNameMapper,
    "^react-native-reanimated$":
      require.resolve("react-native-reanimated/mock"),
    "^react-native-worklets$":
      require.resolve("react-native-worklets/src/mock.ts"),
  },
};

module.exports = { logic, components };
