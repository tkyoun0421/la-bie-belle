import {
  filterBlockedMembers,
  filterPendingMembers,
  type MemberFilterRow,
} from "@/entities/member/utils/filterMembers.utils";

type TestRow = MemberFilterRow & {
  id: string;
  displayName: string | null;
};

function buildRow(overrides: Partial<TestRow> = {}): TestRow {
  return {
    id: "row-1",
    displayName: "박서연",
    submittedAt: null,
    approvedAt: null,
    rejectedAt: null,
    blockedAt: null,
    ...overrides,
  };
}

describe("filterPendingMembers — 제출됐고 아직 판정 안 된 사람만 남긴다", () => {
  it("프로필을 안 보낸 사람은 목록에서 빠진다", () => {
    const rows = [buildRow({ id: "1", submittedAt: null })];

    expect(filterPendingMembers(rows)).toHaveLength(0);
  });

  it("이미 승인된 사람은 목록에서 빠진다", () => {
    const rows = [
      buildRow({
        id: "1",
        submittedAt: "2026-09-20T00:00:00.000Z",
        approvedAt: "2026-09-21T00:00:00.000Z",
      }),
    ];

    expect(filterPendingMembers(rows)).toHaveLength(0);
  });

  it("이미 거절된 사람은 목록에서 빠진다", () => {
    const rows = [
      buildRow({
        id: "1",
        submittedAt: "2026-09-20T00:00:00.000Z",
        rejectedAt: "2026-09-21T00:00:00.000Z",
      }),
    ];

    expect(filterPendingMembers(rows)).toHaveLength(0);
  });

  it("차단된 사람은 제출된 상태여도 목록에서 빠진다", () => {
    const rows = [
      buildRow({
        id: "1",
        submittedAt: "2026-09-20T00:00:00.000Z",
        blockedAt: "2026-09-22T00:00:00.000Z",
      }),
    ];

    expect(filterPendingMembers(rows)).toHaveLength(0);
  });

  it("남은 사람은 먼저 보낸 사람이 위로 오도록 오름차순 정렬한다", () => {
    const rows = [
      buildRow({
        id: "나중",
        displayName: "이도윤",
        submittedAt: "2026-09-23T00:00:00.000Z",
      }),
      buildRow({
        id: "먼저",
        displayName: "박서연",
        submittedAt: "2026-09-20T00:00:00.000Z",
      }),
    ];

    expect(filterPendingMembers(rows).map((row) => row.id)).toEqual([
      "먼저",
      "나중",
    ]);
  });

  it("빈 목록이면 빈 목록을 돌려준다", () => {
    expect(filterPendingMembers([])).toEqual([]);
  });
});

describe("filterBlockedMembers — 차단된 사람만 남긴다", () => {
  it("차단 안 된 사람은 목록에서 빠진다", () => {
    const rows = [buildRow({ id: "1", blockedAt: null })];

    expect(filterBlockedMembers(rows)).toHaveLength(0);
  });

  it("최근에 차단한 사람이 위로 오도록 내림차순 정렬한다", () => {
    const rows = [
      buildRow({
        id: "오래됨",
        displayName: "박서연",
        blockedAt: "2026-09-01T00:00:00.000Z",
      }),
      buildRow({
        id: "최근",
        displayName: "이도윤",
        blockedAt: "2026-09-20T00:00:00.000Z",
      }),
    ];

    expect(filterBlockedMembers(rows).map((row) => row.id)).toEqual([
      "최근",
      "오래됨",
    ]);
  });

  it("빈 목록이면 빈 목록을 돌려준다", () => {
    expect(filterBlockedMembers([])).toEqual([]);
  });
});
