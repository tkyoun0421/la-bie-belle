import { readTextFile } from "./repo.ts";
import type { Violation } from "./violation.ts";

const GATE = "gate:tokens";
const FOUNDATIONS_PATH = "docs/product/design/FOUNDATIONS.md";
const GLOBALS_PATH = "src/app/globals.css";

const TABLE_ROW_PATTERN = /^\|.+\|$/u;
const HEADING_PATTERN = /^#{1,6}[ \t]/u;
const ROOT_BLOCK_PATTERN = /^:root\s*\{/u;
const THEME_BLOCK_PATTERN = /^@theme\s*\{/u;
const TYPO_UTILITY_PATTERN = /^@utility\s+typo-([a-zA-Z0-9-]+)\s*\{/u;
const DECLARATION_PATTERN = /^(--[a-zA-Z0-9\\.-]+):\s*(.+);\s*$/u;
const VAR_REFERENCE_PATTERN = /^var\((--[a-zA-Z0-9-]+)\)$/u;
const SPACE_TOKEN_PATTERN = /^space-([0-9]+(?:\.[0-9]+)?)$/u;
const NAV_SAFE_TOKEN_PATTERN = /^(?:--)?(spacing-nav-[a-z-]+)$/u;

const RAW_PALETTE_HEADING = /^###[ \t]+원시 팔레트[ \t]*$/u;
const SEMANTIC_TOKEN_HEADING = /^###[ \t]+제품 의미 토큰[ \t]*$/u;
const TYPOGRAPHY_HEADING = /^##[ \t]+타이포그래피[ \t]*$/u;
const SPACING_HEADING = /^##[ \t]+간격과 레이아웃[ \t]*$/u;
const NAV_SAFE_HEADING = /^###[ \t]+하단 고정 요소 여백[ \t]*$/u;
const SHAPE_HEADING = /^##[ \t]+형태와 깊이[ \t]*$/u;

type TableRow = { readonly line: number; readonly cells: readonly string[] };
type ParsedTable = { readonly rows: readonly TableRow[] };
type CssVariable = { readonly value: string; readonly line: number };
type TypoUtility = {
  readonly fontSize: string | null;
  readonly lineHeight: string | null;
  readonly fontWeight: string | null;
  readonly line: number;
};
type ResolveResult =
  | { readonly kind: "value"; readonly value: string }
  | { readonly kind: "unresolved"; readonly reference: string };

function splitTableRow(line: string): string[] {
  const inner = line.trim().replace(/^\|/u, "").replace(/\|$/u, "");
  return inner.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(cells: readonly string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/u.test(cell));
}

function stripBackticks(value: string): string {
  return value.replace(/^`/u, "").replace(/`$/u, "").trim();
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function parseTableAfterHeading(lines: readonly string[], headingIndex: number): ParsedTable | null {
  for (let cursor = headingIndex + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor] ?? "";
    if (HEADING_PATTERN.test(line)) {
      return null;
    }
    const trimmed = line.trim();
    if (!TABLE_ROW_PATTERN.test(trimmed)) {
      continue;
    }

    const separatorRaw = (lines[cursor + 1] ?? "").trim();
    if (!TABLE_ROW_PATTERN.test(separatorRaw) || !isSeparatorRow(splitTableRow(separatorRaw))) {
      return null;
    }

    const rows: TableRow[] = [];
    for (let inner = cursor + 2; inner < lines.length; inner += 1) {
      const candidate = (lines[inner] ?? "").trim();
      if (!TABLE_ROW_PATTERN.test(candidate)) {
        break;
      }
      rows.push({ line: inner + 1, cells: splitTableRow(candidate) });
    }
    return { rows };
  }
  return null;
}

function findTable(markdownLines: readonly string[], headingPattern: RegExp): ParsedTable | null {
  const headingIndex = markdownLines.findIndex((line) => headingPattern.test(line));
  if (headingIndex < 0) {
    return null;
  }
  return parseTableAfterHeading(markdownLines, headingIndex);
}

function findBlockRange(cssLines: readonly string[], startPattern: RegExp): { start: number; end: number } | null {
  const start = cssLines.findIndex((line) => startPattern.test(line));
  if (start < 0) {
    return null;
  }
  let depth = 0;
  for (let cursor = start; cursor < cssLines.length; cursor += 1) {
    const line = cssLines[cursor] ?? "";
    depth += (line.match(/\{/gu) ?? []).length;
    depth -= (line.match(/\}/gu) ?? []).length;
    if (depth === 0) {
      return { start, end: cursor };
    }
  }
  return null;
}

function collectVariables(cssLines: readonly string[], startPattern: RegExp): Map<string, CssVariable> {
  const variables = new Map<string, CssVariable>();
  const block = findBlockRange(cssLines, startPattern);
  if (block === null) {
    return variables;
  }
  for (let cursor = block.start + 1; cursor < block.end; cursor += 1) {
    const line = (cssLines[cursor] ?? "").trim();
    const match = DECLARATION_PATTERN.exec(line);
    if (match === null) {
      continue;
    }
    const name = match[1];
    const rawValue = match[2];
    if (name === undefined || rawValue === undefined) {
      continue;
    }
    variables.set(name, { value: rawValue.trim(), line: cursor + 1 });
  }
  return variables;
}

function collectTypoUtilities(cssLines: readonly string[]): Map<string, TypoUtility> {
  const utilities = new Map<string, TypoUtility>();
  for (let cursor = 0; cursor < cssLines.length; cursor += 1) {
    const line = cssLines[cursor] ?? "";
    const match = TYPO_UTILITY_PATTERN.exec(line);
    if (match === null) {
      continue;
    }
    const name = match[1];
    if (name === undefined) {
      continue;
    }

    let depth = 0;
    let end = -1;
    for (let inner = cursor; inner < cssLines.length; inner += 1) {
      const innerLine = cssLines[inner] ?? "";
      depth += (innerLine.match(/\{/gu) ?? []).length;
      depth -= (innerLine.match(/\}/gu) ?? []).length;
      if (depth === 0) {
        end = inner;
        break;
      }
    }
    if (end < 0) {
      continue;
    }

    let fontSize: string | null = null;
    let lineHeight: string | null = null;
    let fontWeight: string | null = null;
    for (let inner = cursor + 1; inner < end; inner += 1) {
      const declaration = (cssLines[inner] ?? "").trim();
      const sizeMatch = /^font-size:\s*(.+);\s*$/u.exec(declaration);
      if (sizeMatch?.[1] !== undefined) {
        fontSize = sizeMatch[1].trim();
      }
      const lineHeightMatch = /^line-height:\s*(.+);\s*$/u.exec(declaration);
      if (lineHeightMatch?.[1] !== undefined) {
        lineHeight = lineHeightMatch[1].trim();
      }
      const weightMatch = /^font-weight:\s*(.+);\s*$/u.exec(declaration);
      if (weightMatch?.[1] !== undefined) {
        fontWeight = weightMatch[1].trim();
      }
    }
    utilities.set(name, { fontSize, lineHeight, fontWeight, line: cursor + 1 });
    cursor = end;
  }
  return utilities;
}

function resolveValue(
  rawValue: string,
  variables: ReadonlyMap<string, CssVariable>,
  seen: ReadonlySet<string> = new Set(),
): ResolveResult {
  const match = VAR_REFERENCE_PATTERN.exec(rawValue.trim());
  if (match === null) {
    return { kind: "value", value: rawValue.trim() };
  }
  const reference = match[1];
  if (reference === undefined || seen.has(reference)) {
    return { kind: "unresolved", reference: reference ?? rawValue };
  }
  const target = variables.get(reference);
  if (target === undefined) {
    return { kind: "unresolved", reference };
  }
  return resolveValue(target.value, variables, new Set([...seen, reference]));
}

function missingTableViolation(label: string): Violation {
  return {
    gate: GATE,
    file: FOUNDATIONS_PATH,
    message: `${label} 표를 ${FOUNDATIONS_PATH}에서 찾을 수 없습니다.`,
    hint: "표 헤더와 구분선이 올바른 마크다운 표 형식인지 확인하세요.",
  };
}

function missingCodeVariableViolation(label: string, docLine: number, cssVariableName: string): Violation {
  return {
    gate: GATE,
    file: FOUNDATIONS_PATH,
    line: docLine,
    message: `${label}: FOUNDATIONS.md:${docLine}이 가리키는 ${cssVariableName}이 ${GLOBALS_PATH}에 없습니다.`,
    hint: `${GLOBALS_PATH}에 해당 CSS 변수 또는 @utility 블록을 추가하세요.`,
  };
}

function mismatchViolation(label: string, docLine: number, expected: string, codeLine: number, actual: string): Violation {
  return {
    gate: GATE,
    file: FOUNDATIONS_PATH,
    line: docLine,
    message: `${label}: FOUNDATIONS.md:${docLine} 기대값 ${expected} / globals.css:${codeLine} 실제값 ${actual}`,
    hint: `${GLOBALS_PATH}의 값을 ${FOUNDATIONS_PATH}에 맞추세요.`,
  };
}

function unresolvedReferenceViolation(label: string, docLine: number, reference: string, codeLine: number): Violation {
  return {
    gate: GATE,
    file: GLOBALS_PATH,
    line: codeLine,
    message: `${label}: globals.css:${codeLine}의 참조 ${reference}가 풀리지 않습니다 (FOUNDATIONS.md:${docLine}).`,
    hint: "참조 대상 --raw-* 변수가 globals.css :root에 있는지 확인하세요.",
  };
}

function unmappableTokenViolation(label: string, docLine: number, token: string): Violation {
  return {
    gate: GATE,
    file: FOUNDATIONS_PATH,
    line: docLine,
    message: `${label}: FOUNDATIONS.md:${docLine}의 토큰 ${token}을 globals.css 변수 이름으로 옮길 수 없습니다.`,
    hint: "표의 토큰 이름을 규약에 맞추거나, 새 이름 규칙이 필요하면 게이트의 매핑을 먼저 넓히세요.",
  };
}

function checkSingleValueTable(
  docLines: readonly string[],
  headingPattern: RegExp,
  tableLabel: string,
  toCssName: (token: string) => string | null,
  codeVariables: ReadonlyMap<string, CssVariable>,
  rowLabel: (token: string) => string,
): Violation[] {
  const table = findTable(docLines, headingPattern);
  if (table === null) {
    return [missingTableViolation(tableLabel)];
  }

  const violations: Violation[] = [];
  for (const row of table.rows) {
    const token = stripBackticks(row.cells[0] ?? "");
    if (token.length === 0) {
      continue;
    }
    const cssName = toCssName(token);
    if (cssName === null) {
      violations.push(unmappableTokenViolation(rowLabel(token), row.line, token));
      continue;
    }
    const expected = stripBackticks(row.cells[1] ?? "");
    const label = rowLabel(token);
    const codeVariable = codeVariables.get(cssName);
    if (codeVariable === undefined) {
      violations.push(missingCodeVariableViolation(label, row.line, cssName));
      continue;
    }
    const resolved = resolveValue(codeVariable.value, codeVariables);
    if (resolved.kind === "unresolved") {
      violations.push(unresolvedReferenceViolation(label, row.line, resolved.reference, codeVariable.line));
      continue;
    }
    if (normalizeValue(resolved.value) !== normalizeValue(expected)) {
      violations.push(mismatchViolation(label, row.line, expected, codeVariable.line, resolved.value));
    }
  }
  return violations;
}

function checkRawPalette(docLines: readonly string[], codeVariables: ReadonlyMap<string, CssVariable>): Violation[] {
  return checkSingleValueTable(
    docLines,
    RAW_PALETTE_HEADING,
    "원시 팔레트",
    (token) => `--raw-${token}`,
    codeVariables,
    (token) => `원시 팔레트 ${token}`,
  );
}

function checkSpacingScale(docLines: readonly string[], codeVariables: ReadonlyMap<string, CssVariable>): Violation[] {
  return checkSingleValueTable(
    docLines,
    SPACING_HEADING,
    "간격과 레이아웃",
    (token) => {
      const match = SPACE_TOKEN_PATTERN.exec(token);
      const scale = match?.[1];
      return scale === undefined ? null : `--spacing-${scale.replace(".", "\\.")}`;
    },
    codeVariables,
    (token) => `간격과 레이아웃 ${token}`,
  );
}

function checkNavSafeSpacing(docLines: readonly string[], codeVariables: ReadonlyMap<string, CssVariable>): Violation[] {
  return checkSingleValueTable(
    docLines,
    NAV_SAFE_HEADING,
    "하단 고정 요소 여백",
    (token) => {
      const name = NAV_SAFE_TOKEN_PATTERN.exec(token)?.[1];
      return name === undefined ? null : `--${name}`;
    },
    codeVariables,
    (token) => `하단 고정 요소 여백 ${token}`,
  );
}

function checkShapeDepth(docLines: readonly string[], codeVariables: ReadonlyMap<string, CssVariable>): Violation[] {
  return checkSingleValueTable(
    docLines,
    SHAPE_HEADING,
    "형태와 깊이",
    (token) => `--${token}`,
    codeVariables,
    (token) => `형태와 깊이 ${token}`,
  );
}

function checkSemanticTokens(docLines: readonly string[], codeVariables: ReadonlyMap<string, CssVariable>): Violation[] {
  const table = findTable(docLines, SEMANTIC_TOKEN_HEADING);
  if (table === null) {
    return [missingTableViolation("제품 의미 토큰")];
  }

  const suffixes: readonly { readonly cellIndex: number; readonly suffix: string; readonly label: string }[] = [
    { cellIndex: 1, suffix: "", label: "전경" },
    { cellIndex: 2, suffix: "-surface", label: "배경" },
    { cellIndex: 3, suffix: "-border", label: "테두리" },
  ];

  const violations: Violation[] = [];
  for (const row of table.rows) {
    const role = stripBackticks(row.cells[0] ?? "");
    if (role.length === 0) {
      continue;
    }
    for (const { cellIndex, suffix, label } of suffixes) {
      const expected = stripBackticks(row.cells[cellIndex] ?? "");
      const cssName = `--color-${role}${suffix}`;
      const rowLabel = `제품 의미 토큰 ${role} ${label}`;
      const codeVariable = codeVariables.get(cssName);
      if (codeVariable === undefined) {
        violations.push(missingCodeVariableViolation(rowLabel, row.line, cssName));
        continue;
      }
      const resolved = resolveValue(codeVariable.value, codeVariables);
      if (resolved.kind === "unresolved") {
        violations.push(unresolvedReferenceViolation(rowLabel, row.line, resolved.reference, codeVariable.line));
        continue;
      }
      if (normalizeValue(resolved.value) !== normalizeValue(expected)) {
        violations.push(mismatchViolation(rowLabel, row.line, expected, codeVariable.line, resolved.value));
      }
    }
  }
  return violations;
}

function checkTypography(docLines: readonly string[], typoUtilities: ReadonlyMap<string, TypoUtility>): Violation[] {
  const table = findTable(docLines, TYPOGRAPHY_HEADING);
  if (table === null) {
    return [missingTableViolation("타이포그래피")];
  }

  const violations: Violation[] = [];
  for (const row of table.rows) {
    const style = stripBackticks(row.cells[0] ?? "");
    if (style.length === 0) {
      continue;
    }
    const sizeLineHeight = (row.cells[1] ?? "").trim();
    const weight = (row.cells[2] ?? "").trim();
    const [sizePart, lineHeightPart] = sizeLineHeight.split("/").map((part) => part.trim());
    const utilityName = `@utility typo-${style}`;

    if (sizePart === undefined || sizePart.length === 0 || lineHeightPart === undefined || lineHeightPart.length === 0) {
      violations.push({
        gate: GATE,
        file: FOUNDATIONS_PATH,
        line: row.line,
        message: `타이포그래피 ${style}: 크기/행간 형식 '${sizeLineHeight}'을 해석할 수 없습니다.`,
        hint: "크기/행간 열을 '32/40' 형식으로 쓰세요.",
      });
      continue;
    }

    const expectedSize = `${sizePart}px`;
    const expectedLineHeight = `${lineHeightPart}px`;
    const utility = typoUtilities.get(style);
    if (utility === undefined) {
      violations.push(missingCodeVariableViolation(`타이포그래피 ${style}`, row.line, utilityName));
      continue;
    }

    if (utility.fontSize === null || normalizeValue(utility.fontSize) !== normalizeValue(expectedSize)) {
      violations.push(
        mismatchViolation(`타이포그래피 ${style} font-size`, row.line, expectedSize, utility.line, utility.fontSize ?? "(없음)"),
      );
    }
    if (utility.lineHeight === null || normalizeValue(utility.lineHeight) !== normalizeValue(expectedLineHeight)) {
      violations.push(
        mismatchViolation(
          `타이포그래피 ${style} line-height`,
          row.line,
          expectedLineHeight,
          utility.line,
          utility.lineHeight ?? "(없음)",
        ),
      );
    }
    if (utility.fontWeight === null || normalizeValue(utility.fontWeight) !== normalizeValue(weight)) {
      violations.push(
        mismatchViolation(`타이포그래피 ${style} font-weight`, row.line, weight, utility.line, utility.fontWeight ?? "(없음)"),
      );
    }
  }
  return violations;
}

export function runTokenParityGate(root: string): Violation[] {
  const foundationsText = readTextFile(root, FOUNDATIONS_PATH);
  if (foundationsText === null) {
    return [
      {
        gate: GATE,
        file: FOUNDATIONS_PATH,
        message: `${FOUNDATIONS_PATH}를 읽을 수 없습니다.`,
        hint: "FOUNDATIONS 문서 경로를 확인하세요.",
      },
    ];
  }

  const globalsText = readTextFile(root, GLOBALS_PATH);
  if (globalsText === null) {
    return [
      {
        gate: GATE,
        file: GLOBALS_PATH,
        message: `${GLOBALS_PATH}를 읽을 수 없습니다.`,
        hint: "globals.css 경로를 확인하세요.",
      },
    ];
  }

  const docLines = foundationsText.split("\n");
  const cssLines = globalsText.split("\n");

  const rootVariables = collectVariables(cssLines, ROOT_BLOCK_PATTERN);
  const themeVariables = collectVariables(cssLines, THEME_BLOCK_PATTERN);
  const codeVariables = new Map<string, CssVariable>([...rootVariables, ...themeVariables]);
  const typoUtilities = collectTypoUtilities(cssLines);

  return [
    ...checkRawPalette(docLines, codeVariables),
    ...checkSemanticTokens(docLines, codeVariables),
    ...checkTypography(docLines, typoUtilities),
    ...checkSpacingScale(docLines, codeVariables),
    ...checkNavSafeSpacing(docLines, codeVariables),
    ...checkShapeDepth(docLines, codeVariables),
  ];
}
