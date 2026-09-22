import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { type MarkdownDoc, parseMarkdown } from "@tests/lint/markdown";
import { frontmatterStatus } from "@tests/lint/spec-docs";

export type SpecGridViolation =
  | { type: "missing-section" }
  | { type: "missing-row"; state: string }
  | { type: "empty-cell"; state: string }
  | { type: "bare-na"; state: string }
  | { type: "missing-ac"; state: string }
  | { type: "unknown-ac"; state: string; ac: string }
  | { type: "missing-verification-layer"; ac: string };

export type SpecGridDoc = {
  /** 저장소 뿌리 기준 경로. */
  file: string;
  violations: SpecGridViolation[];
};

const SPEC_DIR = "docs/2-design/spec";
const APPROVED = "approved";

/** `docs/2-design/README.md#spec`이 드는 해피 패스 밖의 여덟 자리. 적는 순서는 안 따진다. */
const GRID_HEADING = "상태 격자";
const STATES = [
  "빈 상태",
  "로딩",
  "실패",
  "권한 없음",
  "경계",
  "재진입",
  "동시 변경",
  "성공 직후",
];

const NOT_APPLICABLE = "해당 없음";

const AC_HEADING = /^AC-\d+$/;
const AC_REFERENCE = /AC-\d+/g;
const VERIFICATION_LAYER = /^\s*-\s+검증 층\s*:/;
const TABLE_ROW = /^\s*\|(.*)\|\s*$/;
const WORD = /[\p{L}\p{N}]/u;

type GridRow = {
  shown: string;
  acs: string[];
};

/** 이유는 길이가 아니라 「해당 없음」을 덜어낸 자리에 글자가 남는지로 잰다. */
function hasReason(shown: string): boolean {
  return WORD.test(shown.split(NOT_APPLICABLE).join(" "));
}

function gridRows(lines: string[]): Map<string, GridRow> {
  const rows = new Map<string, GridRow>();

  for (const line of lines) {
    const row = TABLE_ROW.exec(line);

    if (!row) {
      continue;
    }

    const cells = row[1].split("|").map((cell) => cell.trim());
    const state = cells[0];

    if (!STATES.includes(state) || rows.has(state)) {
      continue;
    }

    rows.set(state, {
      shown: cells[1] ?? "",
      acs: [...(cells[2] ?? "").matchAll(AC_REFERENCE)].map(
        (match) => match[0],
      ),
    });
  }

  return rows;
}

function rowViolations(
  lines: string[],
  knownAcs: Set<string>,
): SpecGridViolation[] {
  const rows = gridRows(lines);

  return STATES.flatMap((state): SpecGridViolation[] => {
    const row = rows.get(state);

    if (!row) {
      return [{ type: "missing-row", state }];
    }

    if (row.shown === "") {
      return [{ type: "empty-cell", state }];
    }

    const notApplicable = row.shown.includes(NOT_APPLICABLE);

    if (notApplicable && !hasReason(row.shown)) {
      return [{ type: "bare-na", state }];
    }

    /** 덮을 상태가 있는데 가리킬 AC가 없으면 AC가 모자란 것이다 — 「해당 없음」 줄만 면제다. */
    if (!notApplicable && row.acs.length === 0) {
      return [{ type: "missing-ac", state }];
    }

    return row.acs
      .filter((ac) => !knownAcs.has(ac))
      .map((ac) => ({ type: "unknown-ac", state, ac }));
  });
}

/** 층을 못 고른 AC는 아직 관찰 가능한 결과를 안 가진 것이다. */
function verificationLayerViolations(doc: MarkdownDoc): SpecGridViolation[] {
  return doc.headings
    .filter((heading) => AC_HEADING.test(heading.text))
    .filter(
      (heading) =>
        !doc
          .section(heading.text)
          .some((line) => VERIFICATION_LAYER.test(line)),
    )
    .map((heading) => ({
      type: "missing-verification-layer",
      ac: heading.text,
    }));
}

export function specGridViolations(markdown: string): SpecGridViolation[] {
  const doc = parseMarkdown(markdown);
  const knownAcs = new Set(
    doc.headings
      .map((heading) => heading.text)
      .filter((text) => AC_HEADING.test(text)),
  );

  const grid: SpecGridViolation[] = doc.headings.some(
    (heading) => heading.text === GRID_HEADING,
  )
    ? rowViolations(doc.section(GRID_HEADING), knownAcs)
    : [{ type: "missing-section" }];

  return [...grid, ...verificationLayerViolations(doc)];
}

/** 파일 이름을 하드코딩하지 않는다 — spec은 계속 늘어난다. */
function specFiles(root: string): string[] {
  let entries: string[];

  try {
    entries = readdirSync(path.join(root, SPEC_DIR));
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.endsWith(".md"))
    .sort()
    .map((entry) => `${SPEC_DIR}/${entry}`);
}

/** 승인된 spec은 당시 기록이라 지금 틀로 다시 재지 않는다. */
export function repositorySpecGridDocs(
  root: string = process.cwd(),
): SpecGridDoc[] {
  return specFiles(root)
    .map((file) => ({
      file,
      markdown: readFileSync(path.join(root, file), "utf8"),
    }))
    .filter(({ markdown }) => frontmatterStatus(markdown) !== APPROVED)
    .map(({ file, markdown }) => ({
      file,
      violations: specGridViolations(markdown),
    }));
}
