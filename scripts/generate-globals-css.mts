import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

type Row = { cells: string[]; section: string };
type Declaration = { name: string; value: string };
type Group = Declaration[];
type Side = "light" | "dark";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const TOKENS_PATH = path.join(ROOT, "docs/design-system/tokens.md");
const GLOBALS_PATH = path.join(ROOT, "src/app/globals.css");

const PALETTE_HEADER = [
  "단계",
  "라이트 hex",
  "라이트 oklch",
  "다크 hex",
  "다크 oklch",
];
const ROLE_HEADER = ["토큰", "팔레트", "라이트", "다크", "Tailwind 유틸"];
const TYPOGRAPHY_HEADER = [
  "유틸",
  "크기",
  "행간",
  "rem 크기",
  "rem 행간",
  "용도",
];
const RADIUS_HEADER = ["유틸", "값", "쓰는 자리"];
const SHADOW_HEADER = ["유틸", "라이트", "다크"];
const DURATION_HEADER = ["변수", "값", "Tailwind 유틸", "쓰는 자리"];
const CADENCE_HEADER = ["변수", "값", "쓰는 자리"];
const VENDOR_HEADER = ["변수", "값", "자리", "Tailwind 유틸"];

const EMPTY_CELL = "—";
const SUBSECTION = /^###\s+(.+?)\s*$/;
const FENCE_OPEN = "```css";
const FENCE_CLOSE = "```";

const SKELETON = { subsection: "8.1", nth: 0, label: "뼈대" };
const THEME_RESET = {
  subsection: "8.2",
  nth: 0,
  label: "Tailwind 기본값 초기화",
};
const THEME_INLINE_HEAD = {
  subsection: "8.2",
  nth: 1,
  label: "@theme inline 머리",
};
const SHADCN_BRIDGE = { subsection: "8.3", nth: 0, label: "shadcn 다리" };
const BASE_LAYER = { subsection: "8.4", nth: 0, label: "베이스" };

const SURFACE_SHADOW = "--surface-shadow";
const SURFACE_STROKE_IN_DARK = "var(--palette-neutral-200)";
const STATIC_RADIUS_UTILITIES = new Set(["rounded-none", "rounded-full"]);
const ALIASED_PREFIX = /^--(?:palette|role|vendor)-/;

function cellsOf(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) {
    return null;
  }
  return trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim().replace(/^`|`$/g, "").trim());
}

function isHeader(cells: string[], header: string[]): boolean {
  return (
    cells.length === header.length &&
    header.every((label, index) => cells[index] === label)
  );
}

function readRows(markdown: string, header: string[]): Row[] {
  const lines = markdown.split("\n");
  const rows: Row[] = [];
  let section = "";
  let index = 0;

  while (index < lines.length) {
    const heading = SUBSECTION.exec(lines[index]);
    if (heading) {
      section = heading[1];
      index += 1;
      continue;
    }

    const cells = cellsOf(lines[index]);
    if (!cells || !isHeader(cells, header)) {
      index += 1;
      continue;
    }

    index += 2;
    while (index < lines.length) {
      const row = cellsOf(lines[index]);
      if (!row || row.length !== header.length) {
        break;
      }
      rows.push({ cells: row, section });
      index += 1;
    }
  }

  return rows;
}

function requireRows(markdown: string, header: string[], label: string): Row[] {
  const rows = readRows(markdown, header);
  if (rows.length === 0) {
    throw new Error(`${label} 표를 tokens.md에서 찾지 못했다.`);
  }
  return rows;
}

function requireOne(rows: Row[], label: string): Row {
  if (rows.length !== 1) {
    throw new Error(`${label} 는 한 줄이어야 하는데 ${rows.length} 줄이다.`);
  }
  return rows[0];
}

function bySection(rows: Row[]): Row[][] {
  const sections = new Map<string, Row[]>();
  for (const row of rows) {
    const bucket = sections.get(row.section);
    if (bucket) {
      bucket.push(row);
    } else {
      sections.set(row.section, [row]);
    }
  }
  return [...sections.values()];
}

function readFences(markdown: string): Map<string, string[]> {
  const lines = markdown.split("\n");
  const fences = new Map<string, string[]>();
  let subsection = "";
  let index = 0;

  while (index < lines.length) {
    const heading = SUBSECTION.exec(lines[index]);
    if (heading) {
      subsection = heading[1].split(/\s+/)[0];
      index += 1;
      continue;
    }

    if (lines[index].trim() !== FENCE_OPEN) {
      index += 1;
      continue;
    }

    const start = index + 1;
    let end = start;
    while (end < lines.length && lines[end].trim() !== FENCE_CLOSE) {
      end += 1;
    }

    const collected = fences.get(subsection) ?? [];
    collected.push(lines.slice(start, end).join("\n"));
    fences.set(subsection, collected);
    index = end + 1;
  }

  return fences;
}

function requireFence(
  fences: Map<string, string[]>,
  wanted: { subsection: string; nth: number; label: string },
): string {
  const found = fences.get(wanted.subsection)?.[wanted.nth];
  if (found === undefined) {
    throw new Error(
      `${wanted.label} 코드펜스를 tokens.md ${wanted.subsection} 절의 ${wanted.nth + 1}번째 css 펜스에서 찾지 못했다.`,
    );
  }
  return found;
}

function roleVariableOf(token: string): string {
  return `--role-${token.split(".").join("-")}`;
}

function surfaceVariableOf(token: string): string {
  const [property, layer] = token.split(".");
  return `--${layer}-${property}`;
}

function paletteGroups(markdown: string, side: Side): Group[] {
  const column = side === "light" ? 2 : 4;
  return bySection(requireRows(markdown, PALETTE_HEADER, "팔레트")).map(
    (rows) =>
      rows.map((row) => ({
        name: `--palette-${row.section}-${row.cells[0]}`,
        value: row.cells[column],
      })),
  );
}

function roleGroups(rows: Row[]): Group[] {
  return bySection(rows).map((section) =>
    section.map((row) => ({
      name: roleVariableOf(row.cells[0]),
      value:
        row.cells[1] === EMPTY_CELL
          ? `var(${surfaceVariableOf(row.cells[0])})`
          : `var(--palette-${row.cells[1]})`,
    })),
  );
}

function surfaceGroup(markdown: string, roleRows: Row[], side: Side): Group {
  const shadow = requireOne(
    requireRows(markdown, SHADOW_HEADER, "그림자"),
    "그림자 표",
  );
  const stroke = requireOne(
    roleRows.filter((row) => row.cells[1] === EMPTY_CELL),
    "팔레트 칸이 — 인 역할 토큰",
  );

  return [
    {
      name: SURFACE_SHADOW,
      value: side === "light" ? shadow.cells[1] : shadow.cells[2],
    },
    {
      name: surfaceVariableOf(stroke.cells[0]),
      value: side === "light" ? stroke.cells[2] : SURFACE_STROKE_IN_DARK,
    },
  ];
}

function typographyGroup(markdown: string): Group {
  return requireRows(markdown, TYPOGRAPHY_HEADER, "타이포그래피").flatMap(
    (row) => {
      const step = row.cells[0].replace(/^text-/, "");
      return [
        { name: `--text-${step}`, value: `${row.cells[3]}rem` },
        { name: `--text-${step}--line-height`, value: `${row.cells[4]}rem` },
      ];
    },
  );
}

function radiusGroup(markdown: string): Group {
  return requireRows(markdown, RADIUS_HEADER, "라운딩")
    .filter((row) => !STATIC_RADIUS_UTILITIES.has(row.cells[0]))
    .map((row) => ({
      name: `--radius-${row.cells[0].replace(/^rounded-/, "")}`,
      value: row.cells[1],
    }));
}

function variableGroup(rows: Row[]): Group {
  return rows.map((row) => ({ name: row.cells[0], value: row.cells[1] }));
}

function aliasGroups(groups: Group[]): Group[] {
  return groups.map((group) =>
    group.map((declaration) => ({
      name: declaration.name.replace(ALIASED_PREFIX, "--color-"),
      value: `var(${declaration.name})`,
    })),
  );
}

function renderGroups(groups: Group[]): string {
  return groups
    .filter((group) => group.length > 0)
    .map((group) =>
      group.map(({ name, value }) => `${name}: ${value};`).join("\n"),
    )
    .join("\n\n");
}

function renderBlock(selector: string, body: string): string {
  return `${selector} {\n${body}\n}`;
}

function themeName(side: Side): Declaration {
  return { name: "color-scheme", value: side };
}

export async function generateGlobalsCss(markdown: string): Promise<string> {
  const fences = readFences(markdown);
  const roleRows = requireRows(markdown, ROLE_HEADER, "역할 토큰");

  const lightPalette = paletteGroups(markdown, "light");
  const roles = roleGroups(roleRows);
  const vendor = variableGroup(
    requireRows(markdown, VENDOR_HEADER, "바깥이 정한 값"),
  );

  const light = renderGroups([
    [themeName("light")],
    ...lightPalette,
    surfaceGroup(markdown, roleRows, "light"),
  ]);
  const dark = renderGroups([
    [themeName("dark")],
    ...paletteGroups(markdown, "dark"),
    surfaceGroup(markdown, roleRows, "dark"),
  ]);

  const settings = renderGroups([
    ...roles,
    variableGroup(requireRows(markdown, DURATION_HEADER, "모션")),
    variableGroup(requireRows(markdown, CADENCE_HEADER, "되풀이 주기와 계단")),
    vendor,
  ]);

  const theme = [
    renderGroups([typographyGroup(markdown), radiusGroup(markdown)]),
    requireFence(fences, THEME_RESET),
  ].join("\n\n");

  const themeInline = [
    requireFence(fences, THEME_INLINE_HEAD),
    renderGroups(aliasGroups([...lightPalette, ...roles, vendor])),
  ].join("\n\n");

  const assembled = [
    requireFence(fences, SKELETON),
    renderBlock(":root", light),
    renderBlock(
      "@media (prefers-color-scheme: dark)",
      renderBlock(':root:not([data-theme="light"])', dark),
    ),
    renderBlock('[data-theme="dark"]', dark),
    renderBlock(":root", settings),
    renderBlock("@theme", theme),
    renderBlock("@theme inline", themeInline),
    requireFence(fences, SHADCN_BRIDGE),
    requireFence(fences, BASE_LAYER),
  ].join("\n\n");

  const prettierConfig = await resolveConfig(GLOBALS_PATH);
  return format(assembled, { ...prettierConfig, parser: "css" });
}

async function writeGlobalsCss(): Promise<void> {
  const generated = await generateGlobalsCss(readFileSync(TOKENS_PATH, "utf8"));
  const current = existsSync(GLOBALS_PATH)
    ? readFileSync(GLOBALS_PATH, "utf8")
    : "";
  const where = path.relative(ROOT, GLOBALS_PATH);

  if (current === generated) {
    console.log(`${where} 는 그대로다. 바뀐 것이 없다.`);
    return;
  }

  writeFileSync(GLOBALS_PATH, generated);
  console.log(`${where} 를 다시 썼다. tokens.md와 어긋나 있었다.`);
}

const entry = process.argv[1];
if (
  entry !== undefined &&
  path.resolve(entry) === fileURLToPath(import.meta.url)
) {
  await writeGlobalsCss();
}
