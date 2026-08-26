import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import house from "./eslint-rules/index.mjs";

const LAYERS = ["shared", "entities", "features", "screens", "app"];

const RELATIVE_IMPORTS = ["./*", "./**", "../*", "../**"];

const layerBoundaries = LAYERS.map((layer, index) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: RELATIVE_IMPORTS,
            message:
              "상대 경로로 import하지 않는다. src 는 @/ , tests 는 @tests/ 로 가리켜라.",
          },
          ...LAYERS.slice(index + 1).map((upper) => ({
            group: [`@/${upper}`, `@/${upper}/**`],
            message: `${layer} 는 ${upper} 를 모른다. FSD 는 위에서 아래로만 흐른다.`,
          })),
        ],
      },
    ],
  },
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
    "coverage/**",
  ]),

  {
    files: ["**/*.{ts,tsx,mjs}"],
    plugins: { import: importPlugin, house },
    settings: { "import/internal-regex": "^@/" },
    rules: {
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
          ],
          pathGroups: [
            ...LAYERS.map((layer) => ({
              pattern: `@/${layer}/**`,
              group: "internal",
              position: "before",
            })),
            { pattern: "@tests/**", group: "internal", position: "after" },
          ],
          pathGroupsExcludedImportTypes: ["builtin", "object"],
          alphabetize: { order: "asc" },
          "newlines-between": "ignore",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name=/^(describe|it|test|suite|bench)$/][property.name='only']",
          message:
            "집중 실행 표시를 남기지 않는다. .only 가 있으면 나머지 테스트가 안 돈다.",
        },
        {
          selector:
            "MemberExpression[object.object.name='test'][object.property.name='describe'][property.name='only']",
          message:
            "집중 실행 표시를 남기지 않는다. .only 가 있으면 나머지 테스트가 안 돈다.",
        },
      ],
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "unused-imports": unusedImports },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },

  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.ts"],
    rules: {
      "no-console": ["error", { allow: ["error", "warn"] }],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: RELATIVE_IMPORTS,
              message:
                "상대 경로로 import하지 않는다. src 는 @/ , tests 는 @tests/ 로 가리켜라.",
            },
          ],
        },
      ],
    },
  },

  ...layerBoundaries,

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "house/no-cross-slice-import": "error" },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/__tests__/**"],
    rules: {
      "house/no-arbitrary-class-values": "error",
      "house/no-color-literals": "error",
      "house/no-default-palette-class": "error",
    },
  },

  {
    files: ["src/**/*.tsx"],
    rules: { "house/dumb-ui": "error" },
  },
]);

export default eslintConfig;
