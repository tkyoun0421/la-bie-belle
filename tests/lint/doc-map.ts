import { existsSync } from "node:fs";
import path from "node:path";
import { parseMarkdown } from "@tests/lint/markdown";

const MAP_HEADING = "문서 지도";
const BULLET = /^\s*[-*]\s/;
const DOCS_PREFIX = "docs/";

function mappedDocPaths(markdown: string): string[] {
  const bullets = parseMarkdown(markdown)
    .section(MAP_HEADING)
    .filter((line) => BULLET.test(line))
    .join("\n");

  const mapped = parseMarkdown(bullets)
    .codeSpans.map((span) => span.text)
    .filter((text) => text.startsWith(DOCS_PREFIX));

  return [...new Set(mapped)];
}

export function docMapViolations(
  markdown: string,
  root: string = process.cwd(),
): string[] {
  return mappedDocPaths(markdown).filter(
    (docPath) => !existsSync(path.join(root, docPath)),
  );
}
