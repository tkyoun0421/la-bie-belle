import {
  isLeftOverAYear,
  sortActiveMembers,
  sortLeftMembers,
} from "@/entities/member/model/sortMembers.policy";

describe("sortActiveMembers — 재직자를 가나다순으로 세우고 관리자를 위로 안 올린다", () => {
  it("이름을 가나다순으로 세운다", () => {
    const rows = [
      { id: "1", displayName: "최지호", role: "worker" },
      { id: "2", displayName: "김민준", role: "worker" },
      { id: "3", displayName: "박서연", role: "worker" },
    ];

    expect(sortActiveMembers(rows).map((row) => row.id)).toEqual([
      "2",
      "3",
      "1",
    ]);
  });

  it("관리자여도 이름 순서를 앞당기지 않는다", () => {
    const rows = [
      { id: "1", displayName: "최지호", role: "admin" },
      { id: "2", displayName: "김민준", role: "worker" },
    ];

    expect(sortActiveMembers(rows).map((row) => row.id)).toEqual(["2", "1"]);
  });

  it("빈 목록이면 빈 목록을 돌려준다", () => {
    expect(sortActiveMembers([])).toEqual([]);
  });
});

describe("sortLeftMembers — 퇴사자를 퇴사한 날이 늦은 순으로 세운다", () => {
  it("최근에 퇴사한 사람이 위로 온다", () => {
    const rows = [
      { id: "오래됨", leftAt: "2026-01-10T00:00:00.000Z" },
      { id: "최근", leftAt: "2026-09-20T00:00:00.000Z" },
    ];

    expect(sortLeftMembers(rows).map((row) => row.id)).toEqual([
      "최근",
      "오래됨",
    ]);
  });

  it("빈 목록이면 빈 목록을 돌려준다", () => {
    expect(sortLeftMembers([])).toEqual([]);
  });
});

describe("isLeftOverAYear — 퇴사한 지 1년이 지났는지를 판정한다", () => {
  it("퇴사한 지 1년이 채 안 됐으면 거짓이다", () => {
    expect(
      isLeftOverAYear("2025-09-25T00:00:00.000Z", "2026-09-24T00:00:00.000Z"),
    ).toBe(false);
  });

  it("퇴사한 날로부터 정확히 1년째면 참이다", () => {
    expect(
      isLeftOverAYear("2025-09-25T00:00:00.000Z", "2026-09-25T00:00:00.000Z"),
    ).toBe(true);
  });

  it("1년을 넘겼으면 참이다", () => {
    expect(
      isLeftOverAYear("2024-01-01T00:00:00.000Z", "2026-09-25T00:00:00.000Z"),
    ).toBe(true);
  });
});
