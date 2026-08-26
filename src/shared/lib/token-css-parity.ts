export type RoleTokenRow = {
  token: string;
  palette: string | null;
  utility: string;
};

export type ThemeTokens = Record<string, string>;

export type GlobalsCssBlocks = {
  light: ThemeTokens;
  darkMediaQuery: ThemeTokens;
  darkAttribute: ThemeTokens;
};

export type ThemeName = keyof GlobalsCssBlocks;

export type TokenDiffEntry =
  | { token: string; variable: string; status: "match" }
  | { token: string; variable: string; status: "missing"; themes: ThemeName[] }
  | {
      token: string;
      variable: string;
      status: "mismatch";
      mismatches: { theme: ThemeName; expected: string; actual: string }[];
    };

type PaletteValue = { light: string; dark: string };

type CssBlock = {
  selector: string;
  declarations: ThemeTokens;
  children: CssBlock[];
};

const ROLE_HEADER = ["토큰", "팔레트", "라이트", "다크", "Tailwind 유틸"];
const PALETTE_HEADER = [
  "단계",
  "라이트 hex",
  "라이트 oklch",
  "다크 hex",
  "다크 oklch",
];
const EMPTY_CELL = "—";
const DARK_MEDIA = /^@media\b.*prefers-color-scheme\s*:\s*dark/;
const DARK_ATTRIBUTE = /\[data-theme\s*=\s*["']dark["']\]/;
const SECTION_HEADING = /^###\s+(.+?)\s*$/;

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

function readTableRows(
  lines: string[],
  header: string[],
  onRow: (cells: string[], sectionTitle: string) => void,
): void {
  let sectionTitle = "";
  let index = 0;

  while (index < lines.length) {
    const heading = SECTION_HEADING.exec(lines[index]);
    if (heading) {
      sectionTitle = heading[1];
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
      onRow(row, sectionTitle);
      index += 1;
    }
  }
}

export function parseRoleTokenTable(markdown: string): RoleTokenRow[] {
  const rows: RoleTokenRow[] = [];

  readTableRows(markdown.split("\n"), ROLE_HEADER, (cells) => {
    rows.push({
      token: cells[0],
      palette: cells[1] === EMPTY_CELL ? null : cells[1],
      utility: cells[4],
    });
  });

  return rows;
}

function parsePaletteTables(markdown: string): Record<string, PaletteValue> {
  const palette: Record<string, PaletteValue> = {};

  readTableRows(markdown.split("\n"), PALETTE_HEADER, (cells, series) => {
    palette[`${series}-${cells[0]}`] = { light: cells[2], dark: cells[4] };
  });

  return palette;
}

function matchBrace(source: string, open: number): number {
  let depth = 0;
  for (let cursor = open; cursor < source.length; cursor += 1) {
    if (source[cursor] === "{") {
      depth += 1;
    } else if (source[cursor] === "}") {
      depth -= 1;
      if (depth === 0) {
        return cursor;
      }
    }
  }
  return source.length;
}

function addDeclaration(declarations: ThemeTokens, chunk: string): void {
  const separator = chunk.indexOf(":");
  if (separator === -1) {
    return;
  }
  const name = chunk.slice(0, separator).trim();
  if (!name.startsWith("--")) {
    return;
  }
  declarations[name] = chunk
    .slice(separator + 1)
    .trim()
    .replace(/\s+/g, " ");
}

function readDeclarations(
  source: string,
  start: number,
  end: number,
): ThemeTokens {
  const declarations: ThemeTokens = {};
  let buffer = "";
  let cursor = start;

  while (cursor < end) {
    const character = source[cursor];
    if (character === "{") {
      cursor = matchBrace(source, cursor) + 1;
      buffer = "";
      continue;
    }
    if (character === ";") {
      addDeclaration(declarations, buffer);
      buffer = "";
      cursor += 1;
      continue;
    }
    buffer += character;
    cursor += 1;
  }

  addDeclaration(declarations, buffer);
  return declarations;
}

function readBlocks(source: string, start: number, end: number): CssBlock[] {
  const blocks: CssBlock[] = [];
  let head = "";
  let cursor = start;

  while (cursor < end) {
    const character = source[cursor];
    if (character === "{") {
      const close = matchBrace(source, cursor);
      blocks.push({
        selector: head.trim(),
        declarations: readDeclarations(source, cursor + 1, close),
        children: readBlocks(source, cursor + 1, close),
      });
      head = "";
      cursor = close + 1;
      continue;
    }
    if (character === ";") {
      head = "";
      cursor += 1;
      continue;
    }
    head += character;
    cursor += 1;
  }

  return blocks;
}

function mergeDeclarations(blocks: CssBlock[]): ThemeTokens {
  return Object.assign(
    {},
    ...blocks.map((block) => block.declarations),
  ) as ThemeTokens;
}

function splitVarArguments(inner: string): {
  reference: string;
  fallback: string | null;
} {
  let depth = 0;
  for (let cursor = 0; cursor < inner.length; cursor += 1) {
    const character = inner[cursor];
    if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
    } else if (character === "," && depth === 0) {
      return {
        reference: inner.slice(0, cursor).trim(),
        fallback: inner.slice(cursor + 1).trim(),
      };
    }
  }
  return { reference: inner.trim(), fallback: null };
}

function substitute(
  value: string,
  declarations: ThemeTokens,
  seen: Set<string>,
): string {
  let result = "";
  let cursor = 0;

  while (cursor < value.length) {
    const opening = value.indexOf("var(", cursor);
    if (opening === -1) {
      result += value.slice(cursor);
      break;
    }

    const close = matchParen(value, opening + 3);
    const { reference, fallback } = splitVarArguments(
      value.slice(opening + 4, close),
    );
    const resolved = resolve(reference, declarations, seen);
    const replacement =
      resolved ??
      (fallback === null
        ? value.slice(opening, close + 1)
        : substitute(fallback, declarations, seen));

    result += value.slice(cursor, opening) + replacement;
    cursor = close + 1;
  }

  return result;
}

function matchParen(source: string, open: number): number {
  let depth = 0;
  for (let cursor = open; cursor < source.length; cursor += 1) {
    if (source[cursor] === "(") {
      depth += 1;
    } else if (source[cursor] === ")") {
      depth -= 1;
      if (depth === 0) {
        return cursor;
      }
    }
  }
  return source.length - 1;
}

function resolve(
  name: string,
  declarations: ThemeTokens,
  seen: Set<string>,
): string | null {
  if (!Object.hasOwn(declarations, name) || seen.has(name)) {
    return null;
  }
  return substitute(declarations[name], declarations, new Set(seen).add(name));
}

function resolveAll(declarations: ThemeTokens): ThemeTokens {
  const resolved: ThemeTokens = {};
  for (const name of Object.keys(declarations)) {
    resolved[name] = substitute(
      declarations[name],
      declarations,
      new Set([name]),
    );
  }
  return resolved;
}

export function parseGlobalsCss(css: string): GlobalsCssBlocks {
  const blocks = readBlocks(css, 0, css.length);

  const light = mergeDeclarations(
    blocks.filter(
      (block) => block.selector === ":root" || block.selector === "html",
    ),
  );
  const darkAttribute = mergeDeclarations(
    blocks.filter((block) => DARK_ATTRIBUTE.test(block.selector)),
  );
  const darkMediaQuery = mergeDeclarations(
    blocks
      .filter((block) => DARK_MEDIA.test(block.selector))
      .flatMap((block) => block.children),
  );

  return {
    light: resolveAll(light),
    darkMediaQuery: resolveAll({ ...light, ...darkMediaQuery }),
    darkAttribute: resolveAll({ ...light, ...darkAttribute }),
  };
}

export function normalizeOklch(value: string): string {
  const collapsed = value.trim().replace(/\s+/g, " ").toLowerCase();
  const parsed = /^oklch\((.*)\)$/.exec(collapsed);
  if (!parsed) {
    return collapsed;
  }

  const components = parsed[1]
    .trim()
    .split(/\s+/)
    .map((component) => {
      const numeric = Number(component);
      return Number.isFinite(numeric) ? String(numeric) : component;
    });

  return `oklch(${components.join(" ")})`;
}

function variableOf(token: string): string {
  return `--role-${token.split(".").join("-")}`;
}

const THEMES: { name: ThemeName; side: keyof PaletteValue }[] = [
  { name: "light", side: "light" },
  { name: "darkMediaQuery", side: "dark" },
  { name: "darkAttribute", side: "dark" },
];

export function diffTokensAgainstCss(
  markdown: string,
  css: string,
): TokenDiffEntry[] {
  const palette = parsePaletteTables(markdown);
  const blocks = parseGlobalsCss(css);

  return parseRoleTokenTable(markdown).map((row): TokenDiffEntry => {
    const variable = variableOf(row.token);
    const missing = THEMES.filter(
      (theme) => !Object.hasOwn(blocks[theme.name], variable),
    ).map((theme) => theme.name);

    if (missing.length > 0) {
      return { token: row.token, variable, status: "missing", themes: missing };
    }

    if (row.palette === null) {
      return { token: row.token, variable, status: "match" };
    }

    const step = palette[row.palette];
    if (!step) {
      throw new Error(
        `${row.token} 이 가리키는 팔레트 단계 ${row.palette} 가 tokens.md 팔레트 표에 없다.`,
      );
    }

    const mismatches = THEMES.map((theme) => ({
      theme: theme.name,
      expected: normalizeOklch(step[theme.side]),
      actual: normalizeOklch(blocks[theme.name][variable]),
    })).filter((entry) => entry.expected !== entry.actual);

    if (mismatches.length > 0) {
      return { token: row.token, variable, status: "mismatch", mismatches };
    }

    return { token: row.token, variable, status: "match" };
  });
}
