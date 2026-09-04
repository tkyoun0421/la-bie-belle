import { existsSync } from "node:fs";
import path from "node:path";

const MAP_HEADING = "## 문서 지도";
const SECTION_HEADING = /^##\s/;
const BULLET = /^\s*[-*]\s/;
const CODE_SPAN = /`([^`]+)`/g;
const DOCS_PREFIX = "docs/";

function mapSectionLines(markdown: string): string[] {
  const lines = markdown.split("\n");
  const heading = lines.findIndex((line) => line.trim() === MAP_HEADING);
  if (heading === -1) {
    return [];
  }

  const afterHeading = lines.slice(heading + 1);
  const nextHeading = afterHeading.findIndex((line) =>
    SECTION_HEADING.test(line),
  );

  return nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading);
}

function mappedDocPaths(markdown: string): string[] {
  const mapped = mapSectionLines(markdown)
    .filter((line) => BULLET.test(line))
    .flatMap((line) => [...line.matchAll(CODE_SPAN)].map(([, span]) => span))
    .filter((span) => span.startsWith(DOCS_PREFIX));

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
