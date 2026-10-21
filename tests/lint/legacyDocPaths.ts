import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export type LegacyPathViolation = {
  file: string;
  pattern: string;
  line: number;
};

const DOCS = "docs/";

const DESIGN = `${DOCS}2-design/`;

const LEGACY_PATHS = [
  `${DOCS}plan.md`,
  `${DOCS}prd.md`,
  `${DOCS}domain`,
  `${DOCS}adr/`,
  `${DOCS}spec/`,
  `${DOCS}design-system/`,
  `${DESIGN}domain/`,
  `${DESIGN}architecture/`,
  `${DESIGN}design-system/pages/`,
];

const RENAMED_FILE_STEMS: Record<string, string[]> = {
  ".mts": [
    "check-moved-lines",
    "check-sources-impact",
    "e2e-seed-server",
    "font-subset",
    "generate-database-types",
    "generate-globals-css",
    "generate-route-types",
    "inline-sian-font",
    "sync-edge-shared",
    "tokens-md",
    "tossface-fetch",
  ],
  ".mjs": ["module-alias-hooks"],
  ".js": ["seed-session"],
  ".ts": [
    "attendance-constants",
    "backlog-ids",
    "contrast-check",
    "database-types",
    "design-map",
    "doc-links",
    "doc-map",
    "error-codes",
    "file-naming",
    "font-subset",
    "legacy-doc-paths",
    "route-types",
    "rule-check",
    "sian-html",
    "slug-chain",
    "sources-exist",
    "sources-impact",
    "spec-docs",
    "spec-grid",
    "table-rls",
    "tossface-fetch",
  ],
  ".test.ts": [
    "attendance-constants",
    "backlog-ids",
    "contrast-check",
    "dark-media-query-compiles",
    "database-types",
    "design-map",
    "design-token-values",
    "doc-links",
    "doc-map",
    "error-codes",
    "file-naming",
    "font-asset-files",
    "font-subset",
    "format-check",
    "fsd-layer-order",
    "fsd-slice-boundary",
    "generate-globals-css",
    "import-order",
    "legacy-doc-paths",
    "native-compile-values",
    "no-console",
    "no-focused-tests",
    "pre-commit",
    "relative-import",
    "route-types",
    "rule-catalogue",
    "sian-html",
    "slug-chain",
    "sources-exist",
    "sources-impact",
    "spec-docs",
    "spec-grid",
    "table-rls",
    "tailwind-default-palette",
    "tossface-fetch",
    "tsx-dumb-ui",
    "unused-imports",
  ],
};

type LegacyPattern = {
  pattern: string;
  foundIn: (line: string) => boolean;
};

function fileName(stem: string, extension: string): string {
  return `${stem}${extension}`;
}

const OLD_SEED_SESSION = fileName("seed-session", ".js");

function escapedForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function standaloneFileName(name: string): RegExp {
  return new RegExp(`(?<![\\w.-])${escapedForRegExp(name)}(?![\\w-])`);
}

const LEGACY_PATTERNS: LegacyPattern[] = [
  ...LEGACY_PATHS.map((pattern) => ({
    pattern,
    foundIn: (line: string) => line.includes(pattern),
  })),
  ...Object.entries(RENAMED_FILE_STEMS).flatMap(([extension, stems]) =>
    stems.map((stem) => {
      const pattern = fileName(stem, extension);
      const regExp = standaloneFileName(pattern);

      return { pattern, foundIn: (line: string) => regExp.test(line) };
    }),
  ),
];

const SCANNED_ROOTS = [
  "CLAUDE.md",
  ".claude",
  ".github",
  ".githooks",
  "docs",
  "eslint-rules",
  "scripts",
  "src",
  "supabase",
  "tests",
];

const EXCLUDED_PREFIXES = [`${DOCS}log/`, ".claude/worktrees/"];

const SKIPPED_DIRECTORIES = new Set(["node_modules", "__pycache__"]);

const BINARY_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".otf",
  ".pdf",
  ".png",
  ".pyc",
  ".ttf",
  ".webp",
  ".woff",
  ".woff2",
]);

const ALLOWED_LINES = [
  {
    file: "docs/2-design/adr/ADR-004-domain-rules-home.md",
    marker: "디렉터리로 연다",
  },
  {
    file: "docs/3-build/plans/sdlc-gate.md",
    marker: "옮기기 전 경로",
  },
  {
    file: "docs/2-design/adr/ADR-002-sdd-ddd-tdd.md",
    marker: `\`${DESIGN}domain/`,
  },
  {
    file: "docs/2-design/adr/ADR-004-domain-rules-home.md",
    marker: `${DESIGN}domain/`,
  },
  {
    file: "docs/3-build/plans/session-foundation.md",
    marker: `\`${DESIGN}domain/account.md\``,
  },
  {
    file: "docs/3-build/plans/doc-map-links.md",
    marker: `\`${DESIGN}architecture/README.md\``,
  },
  {
    file: "docs/proposals/docs-structure-followup.md",
    marker: "**수정 대상.**",
  },
  {
    file: "tests/lint/e2eFileReferences.test.ts",
    marker: `reference: "scripts/${OLD_SEED_SESSION}"`,
  },
  {
    file: "tests/lint/fileNaming.test.ts",
    marker: 'camelWanted: "src/shared/api/',
  },
  {
    file: "tests/lint/fileNaming.test.ts",
    marker: 'camelWantedTest: "tests/lint/',
  },
  {
    file: "tests/lint/fileNaming.test.ts",
    marker: 'expect(stemOf("database-',
  },
  {
    file: "docs/3-build/plans/schedule-data.md",
    marker: "디렉터리가 없어",
  },
  {
    file: "docs/proposals/canon-and-code-divergence.md",
    marker:
      "[.claude/agents/sian-auditor.md](../../.claude/agents/sian-auditor.md):27",
  },
  {
    file: "docs/proposals/canon-and-code-divergence.md",
    marker: "가리키는 자리가 그 결과다",
  },
  {
    file: "docs/backlog.md",
    marker: "`legacy-bare-script-names`",
  },
  {
    file: "docs/handoff.md",
    marker: "(없는 경로)",
  },
  {
    file: "tests/lint/e2eFileReferences.test.ts",
    marker: `"seedSession.js", "${OLD_SEED_SESSION}")`,
  },
];

function* filesUnder(root: string, relative: string): Generator<string> {
  let entries;
  try {
    entries = readdirSync(path.join(root, relative), { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const child = `${relative}/${entry.name}`;

    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name) || entry.name.startsWith(".")) {
        continue;
      }
      yield* filesUnder(root, child);
    } else if (entry.isFile()) {
      yield child;
    }
  }
}

function scannedFiles(root: string): string[] {
  return SCANNED_ROOTS.flatMap((entry) => {
    let stats;
    try {
      stats = statSync(path.join(root, entry));
    } catch {
      return [];
    }

    return stats.isDirectory() ? [...filesUnder(root, entry)] : [entry];
  });
}

function isScannable(file: string): boolean {
  if (EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix))) {
    return false;
  }

  return !BINARY_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function isAllowed(file: string, line: string): boolean {
  return ALLOWED_LINES.some(
    (allowed) => allowed.file === file && line.includes(allowed.marker),
  );
}

export function legacyPathViolations(root: string): LegacyPathViolation[] {
  const violations: LegacyPathViolation[] = [];

  for (const file of scannedFiles(root).filter(isScannable)) {
    const lines = readFileSync(path.join(root, file), "utf8").split("\n");

    for (const [index, line] of lines.entries()) {
      if (isAllowed(file, line)) {
        continue;
      }

      for (const { pattern, foundIn } of LEGACY_PATTERNS) {
        if (foundIn(line)) {
          violations.push({ file, pattern, line: index + 1 });
        }
      }
    }
  }

  return violations;
}
