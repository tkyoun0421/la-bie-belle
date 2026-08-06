export const ALLOWED_PATHS_HEADING = "## 변경 허용 경로";
export const RISK_LENS_HEADING = "### 위험 기반 테스트";
export const RISK_LENS_COLUMNS: readonly string[] = [
  "인수 조건",
  "Happy Path",
  "주요 실패",
  "경계값",
  "권한",
  "중복 요청",
  "동시성",
];

const HEADING_PATTERN = /^##[ \t]+변경 허용 경로[ \t]*$/u;
const SECTION_PATTERN = /^##[ \t]/u;
const FENCE_PATTERN = /^[ \t]*```/u;
const RISK_LENS_HEADING_PATTERN = /^###[ \t]+위험 기반 테스트[ \t]*$/u;
const RISK_LENS_STOP_PATTERN = /^#{1,3}[ \t]/u;
const TABLE_ROW_PATTERN = /^\|.+\|$/u;

export function parseAllowedPaths(markdown: string): string[] {
  const lines = markdown.split("\n");
  const headingIndex = lines.findIndex((line) => HEADING_PATTERN.test(line));
  if (headingIndex < 0) {
    return [];
  }

  for (let cursor = headingIndex + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor] ?? "";
    if (SECTION_PATTERN.test(line)) {
      return [];
    }
    if (!FENCE_PATTERN.test(line)) {
      continue;
    }
    const paths: string[] = [];
    for (let inner = cursor + 1; inner < lines.length; inner += 1) {
      const candidate = lines[inner] ?? "";
      if (FENCE_PATTERN.test(candidate)) {
        break;
      }
      const value = candidate.trim();
      if (value.length > 0 && !value.startsWith("#")) {
        paths.push(value);
      }
    }
    return paths;
  }

  return [];
}

function splitTableRow(line: string): string[] {
  const inner = line.trim().replace(/^\|/u, "").replace(/\|$/u, "");
  return inner.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(cells: readonly string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/u.test(cell));
}

export type RiskLensRow = {
  readonly line: number;
  readonly criterion: string;
  readonly cells: ReadonlyMap<string, string>;
};

export type RiskLensParseResult =
  | { readonly kind: "missing" }
  | { readonly kind: "header-mismatch"; readonly line: number }
  | { readonly kind: "separator-mismatch"; readonly line: number }
  | { readonly kind: "ok"; readonly headerLine: number; readonly rows: readonly RiskLensRow[] };

function normalizeCriterion(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

export function parseRiskLensTable(markdown: string): RiskLensParseResult {
  const lines = markdown.split("\n");
  const headingIndex = lines.findIndex((line) => RISK_LENS_HEADING_PATTERN.test(line));
  if (headingIndex < 0) {
    return { kind: "missing" };
  }

  for (let cursor = headingIndex + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor] ?? "";
    if (RISK_LENS_STOP_PATTERN.test(line)) {
      return { kind: "missing" };
    }
    const trimmed = line.trim();
    if (!TABLE_ROW_PATTERN.test(trimmed)) {
      continue;
    }

    const headerLine = cursor + 1;
    const header = splitTableRow(trimmed);
    const headerMatches =
      header.length === RISK_LENS_COLUMNS.length &&
      RISK_LENS_COLUMNS.every((name, index) => header[index] === name);
    if (!headerMatches) {
      return { kind: "header-mismatch", line: headerLine };
    }

    const separatorIndex = cursor + 1;
    const separatorLine = separatorIndex + 1;
    const separatorRaw = (lines[separatorIndex] ?? "").trim();
    const separatorCells = TABLE_ROW_PATTERN.test(separatorRaw) ? splitTableRow(separatorRaw) : [];
    const separatorValid =
      TABLE_ROW_PATTERN.test(separatorRaw) &&
      isSeparatorRow(separatorCells) &&
      separatorCells.length === header.length;
    if (!separatorValid) {
      return { kind: "separator-mismatch", line: separatorLine };
    }

    const rows: RiskLensRow[] = [];
    for (let inner = cursor + 2; inner < lines.length; inner += 1) {
      const candidate = (lines[inner] ?? "").trim();
      if (!TABLE_ROW_PATTERN.test(candidate)) {
        break;
      }
      const values = splitTableRow(candidate);
      const cells = new Map<string, string>();
      for (let column = 1; column < RISK_LENS_COLUMNS.length; column += 1) {
        cells.set(RISK_LENS_COLUMNS[column] as string, values[column] ?? "");
      }
      rows.push({ line: inner + 1, criterion: normalizeCriterion(values[0] ?? ""), cells });
    }
    return { kind: "ok", headerLine, rows };
  }

  return { kind: "missing" };
}

export function hasCodePaths(paths: readonly string[]): boolean {
  return paths.some((path) => !path.startsWith("docs/") && !path.startsWith(".claude/"));
}
