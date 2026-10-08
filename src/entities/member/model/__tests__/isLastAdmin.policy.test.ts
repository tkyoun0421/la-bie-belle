import { isLastAdmin } from "@/entities/member/model/isLastAdmin.policy";

const ADMIN = (id: string, overrides: Partial<Row> = {}) => ({
  id,
  role: "admin",
  leftAt: null,
  blockedAt: null,
  ...overrides,
});

const WORKER = (id: string) => ({
  id,
  role: "worker",
  leftAt: null,
  blockedAt: null,
});

type Row = {
  id: string;
  role: string;
  leftAt: string | null;
  blockedAt: string | null;
};

describe("isLastAdmin — 재직 중이고 차단 안 된 관리자가 하나뿐인지를 본다", () => {
  it("활성 관리자가 둘이면 그중 한 명을 열어도 거짓이다", () => {
    const rows = [ADMIN("1"), ADMIN("2")];

    expect(isLastAdmin(rows, "1")).toBe(false);
  });

  it("활성 관리자가 하나뿐이면 그 사람을 열었을 때 참이다", () => {
    const rows = [ADMIN("1"), WORKER("2")];

    expect(isLastAdmin(rows, "1")).toBe(true);
  });

  it("퇴사한 관리자는 셈에서 빠져 남은 활성 관리자가 하나면 참이다", () => {
    const rows = [
      ADMIN("1"),
      ADMIN("2", { leftAt: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(isLastAdmin(rows, "1")).toBe(true);
  });

  it("차단된 관리자는 셈에서 빠져 남은 활성 관리자가 하나면 참이다", () => {
    const rows = [
      ADMIN("1"),
      ADMIN("2", { blockedAt: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(isLastAdmin(rows, "1")).toBe(true);
  });

  it("근무자를 열면 활성 관리자가 하나뿐이어도 거짓이다", () => {
    const rows = [ADMIN("1"), WORKER("2")];

    expect(isLastAdmin(rows, "2")).toBe(false);
  });
});
