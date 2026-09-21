import { readFileSync } from "node:fs";
import path from "node:path";
import {
  backlogColumns,
  backlogRows,
  backlogViolations,
  repositoryBacklog,
} from "@tests/lint/backlog-ids";

const COLUMNS = [
  "작업 ID",
  "작업",
  "상태",
  "선행 작업 ID",
  "spec 또는 plan",
  "검증·완료 근거",
];

function fixture(rows: string[]): string {
  return `# backlog

| ${COLUMNS.join(" | ")} |
| --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

뒷글.
`;
}

function row(
  id: string,
  status: string,
  prerequisites: string,
  document = "미작성 — 행이 완료 조건이다",
): string {
  return `| \`${id}\` | 지어낸 작업 | ${status} | ${prerequisites} | ${document} | — |`;
}

describe("backlog 표 검사", () => {
  it("열 이름의 정본은 docs/README.md 협업 기록의 복사용 틀이다 (회귀)", () => {
    const readme = readFileSync(
      path.join(process.cwd(), "docs/README.md"),
      "utf8",
    );

    expect(backlogColumns(readme)).toEqual(COLUMNS);
  });

  it("현재 저장소의 backlog 표는 위반이 없다 (회귀)", () => {
    const { markdown, columns } = repositoryBacklog();

    expect(backlogViolations(markdown, columns)).toEqual([]);
  });

  it("작업 ID가 겹치면 검출한다", () => {
    const violations = backlogViolations(
      fixture([row("alpha", "ready", "—"), row("alpha", "ready", "—")]),
      COLUMNS,
    );

    expect(violations).toEqual([
      { id: "alpha", detail: "alpha", line: 6, kind: "duplicate-id" },
    ]);
  });

  it("다섯 상태 밖의 상태를 검출한다", () => {
    const violations = backlogViolations(
      fixture([row("alpha", "in-progress", "—")]),
      COLUMNS,
    );

    expect(violations).toEqual([
      { id: "alpha", detail: "in-progress", line: 5, kind: "unknown-status" },
    ]);
  });

  it("표에 없는 선행 작업 ID를 검출한다", () => {
    const violations = backlogViolations(
      fixture([row("alpha", "blocked", "`ghost`")]),
      COLUMNS,
    );

    expect(violations).toEqual([
      { id: "alpha", detail: "ghost", line: 5, kind: "missing-prerequisite" },
    ]);
  });

  it("`·`로 이은 선행 작업 ID를 하나씩 본다", () => {
    const violations = backlogViolations(
      fixture([
        row("alpha", "ready", "—"),
        row("beta", "blocked", "`alpha`·`ghost`"),
      ]),
      COLUMNS,
    );

    expect(violations).toEqual([
      { id: "beta", detail: "ghost", line: 6, kind: "missing-prerequisite" },
    ]);
  });

  it("선행 작업 ID 칸의 미정 링크는 ID가 아니다", () => {
    const violations = backlogViolations(
      fixture([
        row("alpha", "blocked", "[q-01](2-design/system/runtime.md#q-01)"),
      ]),
      COLUMNS,
    );

    expect(violations).toEqual([]);
  });

  it("`—`는 선행 작업이 없다는 뜻이다", () => {
    expect(backlogRows(fixture([row("alpha", "ready", "—")]), COLUMNS)).toEqual(
      [
        {
          id: "alpha",
          status: "ready",
          prerequisites: [],
          documents: [],
          line: 5,
        },
      ],
    );
  });

  it("「spec 또는 plan」 칸의 링크 목적지를 읽는다", () => {
    const rows = backlogRows(
      fixture([row("alpha", "ready", "—", "[plan](3-build/plans/alpha.md)")]),
      COLUMNS,
    );

    expect(rows[0].documents).toEqual(["3-build/plans/alpha.md"]);
  });
});
