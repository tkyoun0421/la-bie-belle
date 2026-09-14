import { readdirSync } from "node:fs";
import { parseMarkdown } from "@tests/lint/markdown";

const MAP_HEADING = "문서 지도";
const BULLET = /^\s*[-*]\s/;
const PAGES_PREFIX = "pages/";
const PAGE_DOC = ".md";

function mappedPagePaths(markdown: string): Set<string> {
  const bullets = parseMarkdown(markdown)
    .section(MAP_HEADING)
    .filter((line) => BULLET.test(line))
    .join("\n");

  return new Set(
    parseMarkdown(bullets)
      .links.map((link) => link.href)
      .filter((href) => href.startsWith(PAGES_PREFIX)),
  );
}

export function designMapViolations(
  markdown: string,
  pagesDir: string,
): string[] {
  const mapped = mappedPagePaths(markdown);

  return readdirSync(pagesDir)
    .filter((entry) => entry.endsWith(PAGE_DOC))
    .map((entry) => `${PAGES_PREFIX}${entry}`)
    .filter((page) => !mapped.has(page))
    .sort();
}
