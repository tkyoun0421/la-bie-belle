import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export type LegacyPathViolation = {
  file: string;
  pattern: string;
  line: number;
};

const DOCS = "docs/";

const LEGACY_PATTERNS = [
  `${DOCS}plan.md`,
  `${DOCS}prd.md`,
  `${DOCS}domain`,
  `${DOCS}adr/`,
  `${DOCS}spec/`,
  `${DOCS}design-system/`,
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

const EXCLUDED_PREFIXES = [`${DOCS}log/`];

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
    file: "docs/2-design/spec/sdlc-gate.md",
    marker: "옮기기 전 경로",
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

      for (const pattern of LEGACY_PATTERNS) {
        if (line.includes(pattern)) {
          violations.push({ file, pattern, line: index + 1 });
        }
      }
    }
  }

  return violations;
}
