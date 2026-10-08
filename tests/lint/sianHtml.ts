import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type SianHtmlViolation = {
  file: string;
  kind: "unclosed" | "stray-close";
  tag: string;
  line: number;
};

const DESIGN = "docs/2-design";

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "circle",
  "col",
  "ellipse",
  "embed",
  "hr",
  "img",
  "input",
  "line",
  "link",
  "meta",
  "param",
  "path",
  "polygon",
  "polyline",
  "rect",
  "source",
  "stop",
  "track",
  "use",
  "wbr",
]);

const IGNORED_TAGS = new Set(["html", "head", "body", "title"]);

const COMMENT = /<!--[\s\S]*?-->/g;
const RAW_TEXT = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;

function blankOut(source: string): string {
  const blank = (matched: string) => matched.replace(/[^\n]/g, " ");
  return source.replace(COMMENT, blank).replace(RAW_TEXT, blank);
}

function lineCounter(source: string): (index: number) => number {
  let cursor = 0;
  let line = 1;
  return (index) => {
    while (cursor < index) {
      if (source[cursor] === "\n") line += 1;
      cursor += 1;
    }
    return line;
  };
}

export function sianHtmlViolations(
  file: string,
  source?: string,
): SianHtmlViolation[] {
  const raw = source ?? readFileSync(file, "utf8");
  const scanned = blankOut(raw);
  const violations: SianHtmlViolation[] = [];
  const open: { tag: string; line: number }[] = [];
  const lineAt = lineCounter(scanned);

  for (const match of scanned.matchAll(TAG)) {
    const [, slash, rawTag, attrs] = match;
    const tag = rawTag.toLowerCase();
    if (VOID_TAGS.has(tag) || IGNORED_TAGS.has(tag)) continue;

    const line = lineAt(match.index);

    if (slash === "") {
      if (attrs.trimEnd().endsWith("/")) continue;
      open.push({ tag, line });
      continue;
    }

    if (open.length > 0 && open[open.length - 1].tag === tag) {
      open.pop();
      continue;
    }

    const depth = open.map((entry) => entry.tag).lastIndexOf(tag);
    if (depth === -1) {
      violations.push({ file, kind: "stray-close", tag, line });
      continue;
    }

    for (const entry of open.slice(depth + 1)) {
      violations.push({
        file,
        kind: "unclosed",
        tag: entry.tag,
        line: entry.line,
      });
    }
    open.length = depth;
  }

  for (const entry of open) {
    violations.push({
      file,
      kind: "unclosed",
      tag: entry.tag,
      line: entry.line,
    });
  }

  return violations;
}

export function sianHtmlFiles(): string[] {
  return (readdirSync(DESIGN, { recursive: true }) as string[])
    .filter((name) => name.endsWith(".sian.html"))
    .map((name) => path.join(DESIGN, name))
    .sort();
}
