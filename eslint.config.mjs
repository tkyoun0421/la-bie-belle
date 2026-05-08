import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      ".agents/**",
      "coverage/**",
      "node_modules/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**"
    ],
    languageOptions: {
      globals: {
        console: "readonly",
        document: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
        window: "readonly",
        __dirname: "readonly",
        __filename: "readonly"
      }
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended
);
