import { calendarDayState } from "@/screens/schedule-worker/model/calendarDayState";

describe("calendarDayState — 안 연 날은 내 근무만 여부와 무관하게 closed다", () => {
  it("안 연 날은 내 근무만을 꺼도 closed다", () => {
    const state = calendarDayState({
      isOpen: false,
      isMyAssignment: false,
      hasIncomingRequest: false,
      showMineOnly: false,
    });

    expect(state).toBe("closed");
  });

  it("안 연 날은 내 근무만을 켜도 closed다", () => {
    const state = calendarDayState({
      isOpen: false,
      isMyAssignment: false,
      hasIncomingRequest: false,
      showMineOnly: true,
    });

    expect(state).toBe("closed");
  });
});

describe("calendarDayState — 내 근무 날은 내 근무만 여부와 무관하게 assigned다", () => {
  it("내 근무만을 꺼도 assigned다", () => {
    const state = calendarDayState({
      isOpen: true,
      isMyAssignment: true,
      hasIncomingRequest: false,
      showMineOnly: false,
    });

    expect(state).toBe("assigned");
  });

  it("내 근무만을 켜도 면과 점이 그대로 assigned다", () => {
    const state = calendarDayState({
      isOpen: true,
      isMyAssignment: true,
      hasIncomingRequest: false,
      showMineOnly: true,
    });

    expect(state).toBe("assigned");
  });
});

describe("calendarDayState — 내 근무만을 켜면 내가 안 나가는 날은 면 없이 muted로, 꺼져 있으면 open이다", () => {
  it("내 근무만이 꺼져 있으면 예식만 있는 날은 open이다", () => {
    const state = calendarDayState({
      isOpen: true,
      isMyAssignment: false,
      hasIncomingRequest: false,
      showMineOnly: false,
    });

    expect(state).toBe("open");
  });

  it("내 근무만을 켜면 같은 날이 muted로 바뀐다 — 눌리는 날은 그대로다", () => {
    const state = calendarDayState({
      isOpen: true,
      isMyAssignment: false,
      hasIncomingRequest: false,
      showMineOnly: true,
    });

    expect(state).toBe("muted");
  });
});

describe("calendarDayState — 근무 요청이 온 날은 내 근무만을 켜도 점선이 남는다", () => {
  it("내 근무만이 꺼져 있으면 requested다", () => {
    const state = calendarDayState({
      isOpen: true,
      isMyAssignment: false,
      hasIncomingRequest: true,
      showMineOnly: false,
    });

    expect(state).toBe("requested");
  });

  it("내 근무만을 켜도 requested가 유지된다", () => {
    const state = calendarDayState({
      isOpen: true,
      isMyAssignment: false,
      hasIncomingRequest: true,
      showMineOnly: true,
    });

    expect(state).toBe("requested");
  });
});
