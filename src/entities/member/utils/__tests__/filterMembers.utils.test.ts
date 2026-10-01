import {
  filterBlockedMembers,
  filterPendingMembers,
  type MemberProfileRow,
} from "@/entities/member/utils/filterMembers.utils";

// 가입 대기·차단 목록을 가르는 순수 함수. 서버가 이미 정렬해서 내려줘도 클라이언트가
// 다시 거르고 정렬하는 함수 한 벌을 정본으로 둔다 — [account/design.md 「가입 승인·거절·
// 차단·해제」]가 조건을 든다.

function buildRow(overrides: Partial<MemberProfileRow> = {}): MemberProfileRow {
  return {
    id: "row-1",
    display_name: "박서연",
    submitted_at: null,
    approved_at: null,
    rejected_at: null,
    blocked_at: null,
    ...overrides,
  };
}

describe("filterPendingMembers — 제출됐고 아직 판정 안 된 사람만 남긴다", () => {
  it("프로필을 안 보낸 사람은 목록에서 빠진다", () => {
    const rows = [buildRow({ id: "1", submitted_at: null })];

    expect(filterPendingMembers(rows)).toHaveLength(0);
  });

  it("이미 승인된 사람은 목록에서 빠진다", () => {
    const rows = [
      buildRow({
        id: "1",
        submitted_at: "2026-09-20T00:00:00.000Z",
        approved_at: "2026-09-21T00:00:00.000Z",
      }),
    ];

    expect(filterPendingMembers(rows)).toHaveLength(0);
  });

  it("이미 거절된 사람은 목록에서 빠진다", () => {
    const rows = [
      buildRow({
        id: "1",
        submitted_at: "2026-09-20T00:00:00.000Z",
        rejected_at: "2026-09-21T00:00:00.000Z",
      }),
    ];

    expect(filterPendingMembers(rows)).toHaveLength(0);
  });

  it("차단된 사람은 제출된 상태여도 목록에서 빠진다", () => {
    const rows = [
      buildRow({
        id: "1",
        submitted_at: "2026-09-20T00:00:00.000Z",
        blocked_at: "2026-09-22T00:00:00.000Z",
      }),
    ];

    expect(filterPendingMembers(rows)).toHaveLength(0);
  });

  it("남은 사람은 먼저 보낸 사람이 위로 오도록 오름차순 정렬한다", () => {
    const rows = [
      buildRow({
        id: "나중",
        display_name: "이도윤",
        submitted_at: "2026-09-23T00:00:00.000Z",
      }),
      buildRow({
        id: "먼저",
        display_name: "박서연",
        submitted_at: "2026-09-20T00:00:00.000Z",
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
    const rows = [buildRow({ id: "1", blocked_at: null })];

    expect(filterBlockedMembers(rows)).toHaveLength(0);
  });

  it("최근에 차단한 사람이 위로 오도록 내림차순 정렬한다", () => {
    const rows = [
      buildRow({
        id: "오래됨",
        display_name: "박서연",
        blocked_at: "2026-09-01T00:00:00.000Z",
      }),
      buildRow({
        id: "최근",
        display_name: "이도윤",
        blocked_at: "2026-09-20T00:00:00.000Z",
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
