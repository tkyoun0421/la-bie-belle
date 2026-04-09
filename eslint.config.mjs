import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".agents/**",
    ".next/**",
    "coverage/**",
    "docs/**",
    "node_modules/**",
    "playwright-report/**",
    "supabase/**",
    "test-results/**"
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./*", "../*"],
              message: "Use the #/* absolute import alias for internal source imports."
            }
          ]
        }
      ]
    }
  }
]);
