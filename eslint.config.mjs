import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
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
  globalIgnores([
    ".next/**",
    ".expo/**",
    "android/**",
    "ios/**",
    "expo-env.d.ts",
    "nativewind-env.d.ts",
    "coverage/**",
    // `pnpm edge:sync`가 만드는 복사본이다. 정본은 `src/`고 이 아래는 생성물이라 커밋도
    // 검사도 안 한다.
    "supabase/functions/_shared/**",
  ]),

  {
    files: ["**/*.{ts,tsx,mts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: "module" },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: { ...tsPlugin.configs.recommended.rules },
  },

  {
    files: ["**/*.{ts,tsx,mts,mjs}"],
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
      // 무는 자리는 규칙 둘이 저마다 들고 있다 — 마운트 경계는 `supabase/functions/`,
      // Deno로 복사되는 폴더는 `src/features/notification/model/`이다. 여기서 글롭으로
      // 좁히면 `rule-catalogue.test.ts`가 조각 파일 하나로 「켜져 있는가」를 재는 것과
      // 어긋난다.
      "house/no-edge-function-src-import": "error",
      "house/no-node-import-in-edge-shared": "error",
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
    files: ["**/*.{ts,tsx,mts}"],
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

  // 무는 자리(`src/screens/**`·`src/features/**`)는 규칙이 들고 있다 —
  // `src/shared/ui/**`와 `src/app/_catalog*`가 규칙 밖인 것도 거기 적혀 있다.
  {
    files: ["src/**/*.tsx"],
    rules: { "house/no-visual-utility-class": "error" },
  },
]);

export default eslintConfig;
