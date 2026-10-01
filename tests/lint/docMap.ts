import { existsSync } from "node:fs";
import path from "node:path";
import { parseMarkdown } from "@tests/lint/markdown";

const MAP_HEADING = "문서 지도";
const BULLET = /^\s*[-*]\s/;
const DOCS_PREFIX = "docs/";

/** 링크 목적지의 `#앵커`는 경로가 아니다. */
function withoutAnchor(href: string): string {
  const hash = href.indexOf("#");
  return hash === -1 ? href : href.slice(0, hash);
}

function mappedDocPaths(markdown: string): string[] {
  const bullets = parseMarkdown(markdown)
    .section(MAP_HEADING)
    .filter((line) => BULLET.test(line))
    .join("\n");

  const parsed = parseMarkdown(bullets);
  const mapped = [
    ...parsed.codeSpans.map((span) => span.text),
    ...parsed.links.map((link) => withoutAnchor(link.href)),
  ].filter((text) => text.startsWith(DOCS_PREFIX));

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
