import {
  boardLineRefs,
  repositoryBoardLineRefs,
  scannedFiles,
} from "@tests/lint/boardLineRefs";

describe("보드 문서 줄 번호 인용 검사", () => {
  it("링크 뒤에 붙은 줄 번호를 잡는다", () => {
    expect(
      boardLineRefs("docs/a.md", "- [backlog.md](../backlog.md):89의 행"),
    ).toEqual([{ file: "docs/a.md", line: 1, text: "backlog.md):89" }]);
  });

  it("코드 칸 안의 줄 번호와 이어 쓴 번호를 잡는다", () => {
    expect(
      boardLineRefs(
        "docs/a.md",
        "첫 줄\n`docs/handoff.md:72`와 backlog.md:113·114",
      ).map((ref) => [ref.line, ref.text]),
    ).toEqual([
      [2, "handoff.md:72"],
      [2, "backlog.md:113·114"],
    ]);
  });

  it("owner-todo도 보드다", () => {
    expect(boardLineRefs("docs/a.md", "owner-todo.md:3")).toHaveLength(1);
  });

  it("줄 번호 없는 링크와 다른 문서의 줄 번호는 안 잡는다", () => {
    expect(
      boardLineRefs(
        "docs/a.md",
        "[backlog.md](../backlog.md)의 `x` 행 · execution.md:238",
      ),
    ).toEqual([]);
  });

  it("log와 observations는 그때의 기록이라 안 본다", () => {
    const files = scannedFiles(process.cwd());

    expect(files.some((file) => file.startsWith("docs/log/"))).toBe(false);
    expect(files.some((file) => file.startsWith("docs/observations/"))).toBe(
      false,
    );
    expect(files).toContain("docs/backlog.md");
    expect(files).toContain("CLAUDE.md");
  });

  it("에이전트 정의문과 스킬은 보고 로컬 worktree는 안 연다", () => {
    const files = scannedFiles(process.cwd());

    expect(files).toContain(".claude/agents/session-recorder.md");
    expect(files.some((file) => file.startsWith(".claude/worktrees/"))).toBe(
      false,
    );
  });

  it("현재 저장소의 문서는 보드를 줄 번호로 인용하지 않는다 (회귀)", () => {
    expect(repositoryBoardLineRefs(process.cwd())).toEqual([]);
  });
});
