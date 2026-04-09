import { defineConfig, globalIgnores } from "eslint/config";
import boundaries from "eslint-plugin-boundaries";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const screenTypes = ["screen-root", "screen-group"];
const mutationTypes = [
  "mutation-actions",
  "mutation-hooks",
  "mutation-schemas",
  "mutation-tests",
];
const queryTypes = [
  "query-constants",
  "query-options",
  "query-services",
  "query-hooks",
  "query-tests",
];
const entityTypes = ["entity-models", "entity-repositories", "entity-tests"];

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
    "test-results/**",
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
          type: "screen-group",
          pattern: "src/screens/*/*/**/*",
          capture: ["scope", "screen"],
        },
        {
          type: "screen-root",
          pattern: "src/screens/*/**/*",
          capture: ["screen"],
        },
        {
          type: "mutation-actions",
          pattern: "src/mutations/*/actions/**/*",
          capture: ["domain"],
        },
        {
          type: "mutation-hooks",
          pattern: "src/mutations/*/hooks/**/*",
          capture: ["domain"],
        },
        {
          type: "mutation-schemas",
          pattern: "src/mutations/*/schemas/**/*",
          capture: ["domain"],
        },
        {
          type: "mutation-tests",
          pattern: "src/mutations/*/tests/**/*",
          capture: ["domain"],
        },
        {
          type: "query-constants",
          pattern: "src/queries/*/constants/**/*",
          capture: ["domain"],
        },
        {
          type: "query-options",
          pattern: "src/queries/*/options/**/*",
          capture: ["domain"],
        },
        {
          type: "query-services",
          pattern: "src/queries/*/services/**/*",
          capture: ["domain"],
        },
        {
          type: "query-hooks",
          pattern: "src/queries/*/hooks/**/*",
          capture: ["domain"],
        },
        {
          type: "query-tests",
          pattern: "src/queries/*/tests/**/*",
          capture: ["domain"],
        },
        {
          type: "entity-models",
          pattern: "src/entities/*/models/**/*",
          capture: ["domain"],
        },
        {
          type: "entity-repositories",
          pattern: "src/entities/*/repositories/**/*",
          capture: ["domain"],
        },
        {
          type: "entity-tests",
          pattern: "src/entities/*/tests/**/*",
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
              from: { type: "screen-root" },
              disallow: {
                to: [
                  { type: "app" },
                  {
                    type: "screen-root",
                    captured: { screen: "!{{ from.captured.screen }}" },
                  },
                ],
              },
              message:
                "A root screen can depend only on itself, lower layers, and shared code.",
            },
            {
              from: { type: "screen-group" },
              disallow: {
                to: [
                  { type: "app" },
                  {
                    type: "screen-group",
                    captured: { scope: "!{{ from.captured.scope }}" },
                  },
                  {
                    type: "screen-group",
                    captured: { screen: "!{{ from.captured.screen }}" },
                  },
                ],
              },
              message:
                "A grouped screen can depend only on its own screen subtree, lower layers, and shared code.",
            },
            {
              from: { type: queryTypes },
              disallow: {
                to: [
                  { type: "app" },
                  { type: screenTypes },
                  { type: mutationTypes },
                  {
                    type: queryTypes,
                    captured: { domain: "!{{ from.captured.domain }}" },
                  },
                  {
                    type: entityTypes,
                    captured: { domain: "!{{ from.captured.domain }}" },
                  },
                ],
              },
              message:
                "The queries layer can depend only on same-domain query modules, same-domain entities, and shared code.",
            },
            {
              from: { type: "query-constants" },
              disallow: {
                to: [
                  {
                    type: [
                      "query-options",
                      "query-services",
                      "query-hooks",
                      "query-tests",
                    ],
                  },
                ],
              },
              message:
                "Query constants must stay pure and cannot depend on query options, services, hooks, or tests.",
            },
            {
              from: { type: "query-options" },
              disallow: {
                to: [{ type: ["query-hooks", "query-tests"] }],
              },
              message:
                "Query options cannot depend on query hooks or tests.",
            },
            {
              from: { type: "query-services" },
              disallow: {
                to: [{ type: ["query-options", "query-hooks", "query-tests"] }],
              },
              message:
                "Query services cannot depend on query options, hooks, or tests.",
            },
            {
              from: { type: mutationTypes },
              disallow: {
                to: [
                  { type: "app" },
                  { type: screenTypes },
                  {
                    type: mutationTypes,
                    captured: { domain: "!{{ from.captured.domain }}" },
                  },
                  {
                    type: [
                      "query-options",
                      "query-services",
                      "query-hooks",
                      "query-tests",
                    ],
                  },
                  {
                    type: "query-constants",
                    captured: { domain: "!{{ from.captured.domain }}" },
                  },
                  {
                    type: entityTypes,
                    captured: { domain: "!{{ from.captured.domain }}" },
                  },
                ],
              },
              message:
                "The mutations layer can depend only on same-domain query constants, same-domain entities, and shared code.",
            },
            {
              from: { type: entityTypes },
              disallow: {
                to: [
                  { type: "app" },
                  { type: screenTypes },
                  { type: queryTypes },
                  { type: mutationTypes },
                  {
                    type: entityTypes,
                    captured: { domain: "!{{ from.captured.domain }}" },
                  },
                ],
              },
              message:
                "The entities layer can depend only on same-domain entity modules and shared code.",
            },
            {
              from: { type: "entity-models" },
              disallow: {
                to: [{ type: ["entity-repositories", "entity-tests"] }],
              },
              message:
                "Entity models must stay pure and cannot depend on repositories or tests.",
            },
            {
              from: { type: "entity-repositories" },
              disallow: {
                to: [{ type: ["entity-tests"] }],
              },
              message:
                "Entity repositories cannot depend on entity tests.",
            },
            {
              from: { type: "shared" },
              disallow: {
                to: [
                  { type: "app" },
                  { type: screenTypes },
                  { type: mutationTypes },
                  { type: queryTypes },
                  { type: entityTypes },
                ],
              },
              message:
                "The shared layer cannot depend on higher application layers.",
            },
          ],
        },
      ],
    },
  },
]);
