import { defineConfig, globalIgnores } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const noRelativeInternalImportsPattern = {
  group: ["./*", "../*"],
  message: "Use the #/* absolute import alias for internal source imports.",
};

function buildRestrictedImportsRule(...patterns) {
  return [
    "error",
    {
      patterns: [noRelativeInternalImportsPattern, ...patterns],
    },
  ];
}

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
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**/*" },
        {
          type: "flows",
          pattern: "src/flows/*/**/*",
          capture: ["domain"],
        },
        {
          type: "query-core",
          pattern:
            "src/queries/*/models/{constants,mappers,repositories,schemas,types}/**/*",
          capture: ["domain"],
        },
        {
          type: "query-services",
          pattern: "src/queries/*/models/services/**/*",
          capture: ["domain"],
        },
        {
          type: "query-hooks",
          pattern: "src/queries/*/hooks/**/*",
          capture: ["domain"],
        },
        {
          type: "query-components",
          pattern: "src/queries/*/components/**/*",
          capture: ["domain"],
        },
        {
          type: "query-tests",
          pattern: "src/queries/*/tests/**/*",
          capture: ["domain"],
        },
        {
          type: "mutations",
          pattern: "src/mutations/*/**/*",
          capture: ["domain"],
        },
        { type: "shared", pattern: "src/shared/**/*" },
      ],
    },
    rules: {
      "no-restricted-imports": buildRestrictedImportsRule(),
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: { type: "flows" },
              disallow: {
                to: [
                  { type: "app" },
                  {
                    type: "flows",
                    captured: { domain: "!{{ from.captured.domain }}" },
                  },
                ],
              },
              message:
                "The flows layer cannot depend on the app layer or another flow domain.",
            },
            {
              from: {
                type: [
                  "query-core",
                  "query-services",
                  "query-hooks",
                  "query-components",
                  "query-tests",
                ],
              },
              disallow: {
                to: [
                  { type: "app" },
                  { type: "flows" },
                  { type: "mutations" },
                  {
                    type: [
                      "query-core",
                      "query-services",
                      "query-hooks",
                      "query-components",
                      "query-tests",
                    ],
                    captured: { domain: "!{{ from.captured.domain }}" },
                  },
                ],
              },
              message:
                "The queries layer cannot depend on app, flows, mutations, or another query domain.",
            },
            {
              from: { type: "query-core" },
              disallow: {
                to: [
                  {
                    type: [
                      "query-services",
                      "query-hooks",
                      "query-components",
                      "query-tests",
                    ],
                  },
                ],
              },
              message:
                "The query core must stay pure and cannot depend on query hooks, components, services, or tests.",
            },
            {
              from: { type: "mutations" },
              disallow: {
                to: [
                  { type: "app" },
                  { type: "flows" },
                  {
                    type: [
                      "query-services",
                      "query-hooks",
                      "query-components",
                      "query-tests",
                    ],
                  },
                  {
                    type: "query-core",
                    captured: { domain: "!{{ from.captured.domain }}" },
                  },
                  {
                    type: "mutations",
                    captured: { domain: "!{{ from.captured.domain }}" },
                  },
                ],
              },
              message:
                "The mutations layer can depend only on shared or same-domain query core.",
            },
            {
              from: { type: "shared" },
              disallow: {
                to: [
                  { type: "app" },
                  { type: "flows" },
                  { type: "query-core" },
                  { type: "query-services" },
                  { type: "query-hooks" },
                  { type: "query-components" },
                  { type: "query-tests" },
                  { type: "mutations" },
                ],
              },
              message:
                "The shared layer cannot depend on higher application layers.",
            },
          ],
        },
      ],
    }
  },
]);
