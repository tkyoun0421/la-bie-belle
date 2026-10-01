// 구현 대상: src/screens/scheduleAdmin/model/openModeSelection.ts
//
// 날 열기 모드에서 고를 수 있는 칸 — 안 연 날이면서 오늘 이후(plan AC-02). SCH-002가
// 「열 수 있는 날 — 오늘부터의 날짜 — 이 하루라도 남았으면」이라고 정해 오늘 당일도
// 골라진다. 「n일 열기」 버튼 라벨은 문안 표(schedule-admin.md 「날 열기 모드 문안」)
// 그대로다.

import {
  isSelectableForOpening,
  openDaysButtonLabel,
} from "@/screens/scheduleAdmin/model/openModeSelection";

describe("isSelectableForOpening — 이미 연 날은 지난 날짜 여부와 무관하게 못 고른다", () => {
  it("오늘이거나 미래 날짜여도 열려 있으면 false다", () => {
    const selectable = isSelectableForOpening({
      workDate: "2026-10-10",
      isOpen: true,
      now: "2026-09-29T00:00:00Z",
    });

    expect(selectable).toBe(false);
  });
});

describe("isSelectableForOpening — 안 연 날 중 지난 날짜는 못 고른다", () => {
  it("오늘(KST) 이전 날짜는 false다", () => {
    const selectable = isSelectableForOpening({
      workDate: "2026-09-28",
      isOpen: false,
      now: "2026-09-29T00:00:00Z",
    });

    expect(selectable).toBe(false);
  });
});

describe("isSelectableForOpening — 안 연 날 중 오늘부터는 고를 수 있다", () => {
  it("오늘(KST) 당일은 true다", () => {
    const selectable = isSelectableForOpening({
      workDate: "2026-09-29",
      isOpen: false,
      now: "2026-09-29T00:00:00Z",
    });

    expect(selectable).toBe(true);
  });

  it("미래 날짜는 true다", () => {
    const selectable = isSelectableForOpening({
      workDate: "2026-10-10",
      isOpen: false,
      now: "2026-09-29T00:00:00Z",
    });

    expect(selectable).toBe(true);
  });
});

describe("openDaysButtonLabel — 0개면 고르라는 안내가 버튼에 선다", () => {
  it("0개면 「열 날을 고르세요」다", () => {
    expect(openDaysButtonLabel(0)).toBe("열 날을 고르세요");
  });
});

describe("openDaysButtonLabel — n개면 그 수를 센다", () => {
  it("3개면 「3일 열기」다", () => {
    expect(openDaysButtonLabel(3)).toBe("3일 열기");
  });
});
