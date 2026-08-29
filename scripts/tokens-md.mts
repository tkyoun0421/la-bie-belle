export type Row = { cells: string[]; section: string };

export const PALETTE_HEADER = [
  "단계",
  "라이트 hex",
  "라이트 oklch",
  "다크 hex",
  "다크 oklch",
];
export const ROLE_HEADER = [
  "토큰",
  "팔레트",
  "라이트",
  "다크",
  "Tailwind 유틸",
];

export const EMPTY_CELL = "—";

const SUBSECTION = /^###\s+(.+?)\s*$/;

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

export function readRows(markdown: string, header: string[]): Row[] {
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

export function requireRows(
  markdown: string,
  header: string[],
  label: string,
): Row[] {
  const rows = readRows(markdown, header);
  if (rows.length === 0) {
    throw new Error(`${label} 표를 tokens.md에서 찾지 못했다.`);
  }
  return rows;
}

export function bySection(rows: Row[]): Row[][] {
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
