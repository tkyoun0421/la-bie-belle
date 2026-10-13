import {
  isSelectableForOpening,
  openDaysButtonLabel,
  openDaysFailureToast,
} from "@/screens/scheduleAdmin/model/openModeSelection.policy";

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

describe("openDaysFailureToast — 못 연 날을 한 줄로 알린다", () => {
  it("실패가 없으면 null이다", () => {
    expect(openDaysFailureToast([])).toBeNull();
  });

  it("하루면 그 날짜만 적는다", () => {
    expect(openDaysFailureToast(["2026-10-10"])).toBe(
      "10월 10일은 열지 못했어요",
    );
  });

  it("여럿이면 가장 이른 날짜 외 나머지 일수를 적는다", () => {
    expect(
      openDaysFailureToast(["2026-10-12", "2026-10-10", "2026-10-11"]),
    ).toBe("10월 10일 외 2일은 열지 못했어요");
  });
});
