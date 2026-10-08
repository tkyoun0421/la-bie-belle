import {
  adminCalendarDayState,
  confirmedVacancyCount,
} from "@/screens/scheduleAdmin/model/adminCalendarDayState.policy";

describe("adminCalendarDayState — 안 연 날은 열기 모드 선택 여부와 무관하게 closed다", () => {
  it("안 열렸고 안 골랐으면 closed다", () => {
    const state = adminCalendarDayState({ isOpen: false, isPicked: false });

    expect(state).toBe("closed");
  });
});

describe("adminCalendarDayState — 열린 날은 admin-open이다", () => {
  it("열렸고 안 골랐으면 admin-open이다", () => {
    const state = adminCalendarDayState({ isOpen: true, isPicked: false });

    expect(state).toBe("admin-open");
  });
});

describe("adminCalendarDayState — 열기 모드에서 고른 날은 admin-picked다", () => {
  it("안 열렸어도 골랐으면 admin-picked다", () => {
    const state = adminCalendarDayState({ isOpen: false, isPicked: true });

    expect(state).toBe("admin-picked");
  });

  it("열려 있어도 골랐으면 admin-picked다", () => {
    const state = adminCalendarDayState({ isOpen: true, isPicked: true });

    expect(state).toBe("admin-picked");
  });
});

describe("confirmedVacancyCount — 확정 전에는 칸에 빈 자리 수를 안 그린다", () => {
  it("확정 전이면 빈 자리가 있어도 null이다", () => {
    const count = confirmedVacancyCount({
      isConfirmed: false,
      openSlotCount: 3,
    });

    expect(count).toBeNull();
  });
});

describe("confirmedVacancyCount — 확정 뒤에는 빈 자리 수를 그대로 낸다", () => {
  it("확정 뒤 빈 자리가 있으면 그 수다", () => {
    const count = confirmedVacancyCount({
      isConfirmed: true,
      openSlotCount: 3,
    });

    expect(count).toBe(3);
  });

  it("확정 뒤 빈 자리가 0이면 0이다 — 단이 빈다는 것은 화면이 그린다", () => {
    const count = confirmedVacancyCount({
      isConfirmed: true,
      openSlotCount: 0,
    });

    expect(count).toBe(0);
  });
});
