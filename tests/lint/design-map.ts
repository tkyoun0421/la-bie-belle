import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parseMarkdown } from "@tests/lint/markdown";

export type DesignMap = {
  /** 지도 절이 든 마크다운 본문. */
  markdown: string;
  /** 그 마크다운이 놓인 디렉터리. 불릿 링크의 기준이다. */
  dir: string;
  /** 지도 절의 제목. */
  heading: string;
};

const BULLET = /^\s*[-*]\s/;
const SCREEN_DOC = ".md";
const DESIGN = "docs/2-design";
const LEGACY_PAGES = path.join(DESIGN, "design-system", "pages");
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

/** 어느 지도에도 안 걸린 화면 문서를 절대 경로로 돌려준다. */
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

/** 옛 `design-system/pages/`와 영역마다의 `screens/`가 화면 문서의 자리다. */
export function screenDirs(root: string = process.cwd()): string[] {
  const design = path.join(root, DESIGN);
  const found = (readdirSync(design, { recursive: true }) as string[])
    .map((entry) => path.join(design, entry))
    .filter((entry) => path.basename(entry) === SCREENS)
    .filter((entry) => statSync(entry).isDirectory());

  const legacy = path.join(root, LEGACY_PAGES);

  return [...(existsSync(legacy) ? [legacy] : []), ...found].sort();
}

/** 화면 문서를 드는 지도 둘. 영역으로 옮긴 화면은 업무 영역 지도가 든다. */
export function designMaps(root: string = process.cwd()): DesignMap[] {
  return [
    {
      file: path.join(root, DESIGN, "design-system", "README.md"),
      heading: "문서 지도",
    },
    {
      file: path.join(root, DESIGN, "modules", "README.md"),
      heading: "지도",
    },
  ].map(({ file, heading }) => ({
    markdown: readFileSync(file, "utf8"),
    dir: path.dirname(file),
    heading,
  }));
}
