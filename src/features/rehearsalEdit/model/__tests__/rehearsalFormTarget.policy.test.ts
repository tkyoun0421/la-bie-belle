import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";
import { openedAddSheet } from "@/features/rehearsalEdit/model/rehearsalFormTarget.policy";

const TIMED: Rehearsal = {
  id: "a",
  profileId: "me",
  workDate: "2026-10-05",
  startsAt: "14:00:00",
  endsAt: "16:00:00",
  count: null,
  name: null,
};

const COUNTED: Rehearsal = {
  ...TIMED,
  startsAt: null,
  endsAt: null,
  count: 3,
};

describe("openedAddSheet — 넣는 면은 빈 값으로 선다", () => {
  it("그 날이 정한 갈래를 쓰고 값은 비어 있다", () => {
    const state = openedAddSheet({
      mode: "add",
      workDate: "2026-10-05",
      formKind: "count",
    });

    expect(state.formKind).toBe("count");
    expect(state.values).toEqual({ startsAt: "", endsAt: "", count: "" });
    expect(state.notice).toBeNull();
  });
});

describe("openedAddSheet — 고치는 면은 그 줄의 값을 싣는다", () => {
  it("시각으로 넣은 줄은 초를 떼고 실린다", () => {
    const state = openedAddSheet({ mode: "edit", rehearsal: TIMED });

    expect(state.formKind).toBe("time");
    expect(state.values).toEqual({
      startsAt: "14:00",
      endsAt: "16:00",
      count: "",
    });
  });

  it("건수로 넣은 줄은 건수만 실린다", () => {
    const state = openedAddSheet({ mode: "edit", rehearsal: COUNTED });

    expect(state.formKind).toBe("count");
    expect(state.values).toEqual({ startsAt: "", endsAt: "", count: "3" });
  });

  it("처음 연 면에는 알림이 없다", () => {
    expect(
      openedAddSheet({ mode: "edit", rehearsal: TIMED }).notice,
    ).toBeNull();
  });
});
