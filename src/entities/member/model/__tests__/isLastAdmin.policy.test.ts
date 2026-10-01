import { isLastAdmin } from "@/entities/member/model/isLastAdmin.policy";

// 관리자 내리기·퇴사 처리 버튼을 화면이 미리 잠그는 판정이다(`docs/2-design/modules/
// account/screens/members.md`의 「마지막 관리자」). 셈은 [account/README.md ACC-008]대로
// 재직 중이고 차단되지 않은 관리자다 — 서버가 다시 세므로 여기는 화면 몫만 판정한다.

const ADMIN = (id: string, overrides: Partial<Row> = {}) => ({
  id,
  role: "admin",
  left_at: null,
  blocked_at: null,
  ...overrides,
});

const WORKER = (id: string) => ({
  id,
  role: "worker",
  left_at: null,
  blocked_at: null,
});

type Row = {
  id: string;
  role: string;
  left_at: string | null;
  blocked_at: string | null;
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
      ADMIN("2", { left_at: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(isLastAdmin(rows, "1")).toBe(true);
  });

  it("차단된 관리자는 셈에서 빠져 남은 활성 관리자가 하나면 참이다", () => {
    const rows = [
      ADMIN("1"),
      ADMIN("2", { blocked_at: "2026-01-01T00:00:00.000Z" }),
    ];

    expect(isLastAdmin(rows, "1")).toBe(true);
  });

  it("근무자를 열면 활성 관리자가 하나뿐이어도 거짓이다", () => {
    const rows = [ADMIN("1"), WORKER("2")];

    expect(isLastAdmin(rows, "2")).toBe(false);
  });
});
