import nextPlugin from "@next/eslint-plugin-next";
import importX from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

import project from "./tools/eslint-plugin-project/index.mjs";

const ENV_MODULE = "src/shared/config/env.ts";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
      ".probe/**",
    ],
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2024,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { project, "import-x": importX },
    rules: {
      "project/no-comments": "error",
      "import-x/no-cycle": "error",
      "no-console": "warn",
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: `process.env는 ${ENV_MODULE}에서만 읽습니다 (DEV-SEC-02). 검증된 값을 import해서 쓰세요.`,
        },
      ],
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { project },
    rules: {
      "project/layer-direction": "error",
      "project/segment-name": "error",
      "project/segment-imports": "error",
      "project/no-runtime-export": "error",
      "project/require-server-only": "error",
      "project/file-naming": "error",
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  {
    files: [`${ENV_MODULE}`],
    rules: { "no-restricted-properties": "off" },
  },
];
