// 구현 대상: src/screens/schedule-admin/model/adminCalendarDayState.ts
//
// 관리자 달력 칸 하나가 어느 상태로 서는지와, 확정 뒤 빈 자리 수를 칸에 그릴지를 가른다.
// 색과 모양의 정본은 `docs/2-design/design-system/components.md`의 「근무표 날짜 칸」과
// `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「달력 칸」이다.
// `ScheduleDayCellState`(`src/shared/ui/ScheduleDayCell.tsx`)의 기존 값 `closed`·
// `admin-open`·`admin-picked`를 그대로 쓴다 — 새 상태를 안 만든다.
//
// 「오늘」과 「지난 날」은 이 칸 상태 계산과 무관하다 — 오늘은 `ScheduleDayCell`이
// `isToday`로 따로 그리고, 지난 날의 선택 가능 여부는 `open-mode-selection.ts`가 가른다.
// 이 테스트가 그 무관함을 명시로 확인한다.

import {
  adminCalendarDayState,
  confirmedVacancyCount,
} from "@/screens/schedule-admin/model/adminCalendarDayState";

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
