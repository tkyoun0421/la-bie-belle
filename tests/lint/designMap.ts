import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parseMarkdown } from "@tests/lint/markdown";

export type DesignMap = {
  markdown: string;
  dir: string;
  heading: string;
};

const BULLET = /^\s*[-*]\s/;
const SCREEN_DOC = ".md";
const DESIGN = "docs/2-design";
const SCREENS = "screens";

function withoutAnchor(href: string): string {
  const hash = href.indexOf("#");
  return hash === -1 ? href : href.slice(0, hash);
}

function mappedScreenPaths(map: DesignMap): string[] {
  const bullets = parseMarkdown(map.markdown)
    .section(map.heading)
    .filter((line) => BULLET.test(line))
    .join("\n");

  return parseMarkdown(bullets).links.map((link) =>
    path.resolve(map.dir, withoutAnchor(link.href)),
  );
}

function screenDocsIn(dir: string): string[] {
  return readdirSync(dir)
    .filter((entry) => entry.endsWith(SCREEN_DOC))
    .map((entry) => path.join(dir, entry));
}

export function designMapViolations(
  maps: DesignMap[],
  screenDirs: string[],
): string[] {
  const mapped = new Set(maps.flatMap(mappedScreenPaths));

  return screenDirs
    .flatMap(screenDocsIn)
    .filter((file) => !mapped.has(file))
    .sort();
}

export function screenDirs(root: string = process.cwd()): string[] {
  const design = path.join(root, DESIGN);

  return (readdirSync(design, { recursive: true }) as string[])
    .map((entry) => path.join(design, entry))
    .filter((entry) => path.basename(entry) === SCREENS)
    .filter((entry) => statSync(entry).isDirectory())
    .sort();
}

export function designMaps(root: string = process.cwd()): DesignMap[] {
  return [
    {
      file: path.join(root, DESIGN, "modules", "README.md"),
      heading: "영역 지도",
    },
  ].map(({ file, heading }) => ({
    markdown: readFileSync(file, "utf8"),
    dir: path.dirname(file),
    heading,
  }));
}
