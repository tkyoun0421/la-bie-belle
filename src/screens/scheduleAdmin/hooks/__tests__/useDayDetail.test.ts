import { jest } from "@jest/globals";

const { renderHook, act } = await import("@testing-library/react-native");
const { dayConfirmGate } =
  await import("@/screens/scheduleAdmin/model/confirmGate.policy");
const { DomainError } = await import("@/shared/model/error.type");
const { DISCARD_DROP_ID } =
  await import("@/screens/scheduleAdmin/consts/scheduleAdmin.const");
const { positionDragId, slotDragId } =
  await import("@/screens/scheduleAdmin/utils/dragId.utils");
const { useDayDetail } =
  await import("@/screens/scheduleAdmin/hooks/useDayDetail");

type Input = Parameters<typeof useDayDetail>[0];

const SLOTS = [
  { id: "s1", positions: ["스캔"], endedAt: null },
  { id: "s2", positions: ["스캔"], endedAt: null },
  { id: "s3", positions: ["메인"], endedAt: null },
];

const ASSIGNMENTS = [
  {
    id: "a1",
    slotId: "s1",
    position: "스캔",
    kind: "regular",
    profileId: "p1",
    endedAt: null,
    name: "이준호",
  },
];

function member(over: Record<string, unknown>) {
  return {
    id: "p1",
    displayName: "이준호",
    photoUrl: null,
    role: "member",
    leftAt: null,
    blockedAt: null,
    erasedAt: null,
    phone: "010-0000-0001",
    birthDate: "1998-03-04",
    gender: "male",
    notificationsEnabled: true,
    hasDevice: true,
    ...over,
  };
}

const MEMBERS = [
  member({ id: "p1", displayName: "이준호" }),
  member({ id: "p2", displayName: "박수진" }),
  member({ id: "p3", displayName: "최민서" }),
  member({ id: "p4", displayName: "강하늘", notificationsEnabled: false }),
];

const QUALIFICATIONS = [{ profileId: "p2", position: "스캔" }];

const HANDLER_NAMES = [
  "onPressHours",
  "onCloseDay",
  "onAddSlot",
  "onRemoveSlot",
  "onMergeSlots",
  "onSplitSlot",
  "onAddAssignment",
  "onGrantAndAssign",
  "onRemoveAssignment",
  "onForceChange",
  "onSendWorkRequest",
  "onSetHoliday",
  "onSetAdjustment",
  "onAdjustSettled",
  "onReloadDay",
] as const;

type Handlers = Record<(typeof HANDLER_NAMES)[number], jest.Mock>;

function handlers(): Handlers {
  return Object.fromEntries(
    HANDLER_NAMES.map((name) => [name, jest.fn()]),
  ) as Handlers;
}

function inputOf(over: Partial<Input> = {}): Input {
  return {
    dayId: "d1",
    workDate: "2026-10-10",
    startsAt: "10:00:00",
    endsAt: "18:00:00",
    slots: SLOTS,
    assignments: ASSIGNMENTS,
    applicationNames: ["박수진"],
    appliedProfileIds: ["p1", "p2", "p3"],
    members: MEMBERS,
    qualifications: QUALIFICATIONS,
    slotRequests: [],
    holidays: [],
    adjustments: [],
    rehearsals: [],
    serverNowMs: Date.parse("2026-10-05T03:00:00.000Z"),
    gate: dayConfirmGate({
      openedAt: "2026-09-20T00:00:00.000Z",
      confirmedAt: null,
    }),
    isConfirmed: false,
    sending: false,
    adjusting: false,
    adjusted: false,
    adjustError: null,
    ...handlers(),
    ...over,
  } as unknown as Input;
}

function mounted(over: Partial<Input> = {}) {
  const input = inputOf(over);
  const hook = renderHook((next: Input) => useDayDetail(next), {
    initialProps: input,
  });

  return { ...hook, input: input as unknown as Input & Handlers };
}

function positionRow(
  screen: ReturnType<typeof useDayDetail>,
  position: string,
) {
  const row = screen.positions.find((one) => one.position === position);

  if (row === undefined) {
    throw new Error(`${position} 줄이 없다`);
  }

  return row;
}

describe("useDayDetail — 확정 갈림과 자격 갈림이 한 손에서 난다", () => {
  it("머리와 줄들이 받은 값 그대로 선다", () => {
    const { result } = mounted();

    expect(result.current.title).toBe("10월 10일(토)");
    expect(result.current.fillLabel).toBe("1/3");
    expect(result.current.hoursLine).toContain("10:00");
    expect(result.current.showApplications).toBe(true);
    expect(result.current.applicationsLine).toContain("박수진");
    expect(result.current.showCloseDay).toBe(true);
    expect(result.current.positions).toHaveLength(9);
    expect(positionRow(result.current, "스캔").slots).toHaveLength(2);
  });

  it("신청이 없으면 그 줄이 통째로 없다", () => {
    const { result } = mounted({ applicationNames: [] });

    expect(result.current.showApplications).toBe(false);
  });

  it("확정된 달은 날 닫기가 없다", () => {
    const { result } = mounted({ isConfirmed: true });

    expect(result.current.showCloseDay).toBe(false);
  });

  it("받아온 공휴일이면 스위치가 잠긴다", () => {
    const { result } = mounted({ holidays: [{ source: "api" }] });

    expect(result.current.holiday.checked).toBe(true);
    expect(result.current.holiday.locked).toBe(true);
  });

  it("자물쇠는 줄마다 따로 풀리고 다시 잠긴다", () => {
    const { result } = mounted();

    expect(positionRow(result.current, "스캔").unlocked).toBe(false);

    act(() => positionRow(result.current, "스캔").onToggleLock());

    expect(positionRow(result.current, "스캔").unlocked).toBe(true);
    expect(positionRow(result.current, "메인").unlocked).toBe(false);

    act(() => positionRow(result.current, "스캔").onToggleLock());

    expect(positionRow(result.current, "스캔").unlocked).toBe(false);
  });

  it("빈 자리를 누르면 픽커가 서고 찬 자리를 누르면 자리 시트가 선다", () => {
    const { result } = mounted();

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    expect(result.current.picker?.title).toContain("스캔");
    expect(result.current.picker?.title).toContain("10월 10일(토)");

    act(() => result.current.picker?.close());
    act(() => positionRow(result.current, "스캔").onPressSlot("s1"));

    expect(result.current.picker).toBeNull();
    expect(result.current.slotSheet).not.toBeNull();
  });

  it("픽커가 사람을 갈래로 나눠 세운다", () => {
    const { result } = mounted();

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    const entries = result.current.picker?.entries ?? [];
    const categoryOf = (profileId: string) =>
      entries.find((one) => one.profileId === profileId)?.category;

    expect(categoryOf("p1")).toBe("assigned");
    expect(categoryOf("p2")).toBe("assignable");
    expect(categoryOf("p3")).toBe("not_qualified");
    expect(categoryOf("p4")).toBe("not_applied");
  });

  it("확정 전에는 고른 사람이 바로 배정되고 픽커가 닫힌다", () => {
    const { result, input } = mounted();

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    const entry = result.current.picker?.entries.find(
      (one) => one.profileId === "p2",
    );

    act(() => result.current.picker?.pick(entry!));

    expect(input.onAddAssignment).toHaveBeenCalledWith({
      profileId: "p2",
      kind: "regular",
      slotId: "s2",
      skipQualification: false,
    });
    expect(result.current.picker).toBeNull();
  });

  it("확정 뒤에는 확인 시트를 거쳐야 나간다", () => {
    const { result, input } = mounted({ isConfirmed: true });

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    const entry = result.current.picker?.entries.find(
      (one) => one.profileId === "p2",
    );

    act(() => result.current.picker?.pick(entry!));

    expect(input.onAddAssignment).not.toHaveBeenCalled();
    expect(result.current.confirmChange?.copy).toEqual(
      expect.objectContaining({ kind: "add", incomingName: "박수진" }),
    );

    act(() => result.current.confirmChange?.confirm());

    expect(input.onAddAssignment).toHaveBeenCalled();
    expect(result.current.confirmChange).toBeNull();
  });

  it("알림이 안 닿는 사람은 확인 시트가 그렇게 말한다", () => {
    const { result } = mounted({
      isConfirmed: true,
      qualifications: [{ profileId: "p4", position: "스캔" }],
      appliedProfileIds: ["p1", "p4"],
    });

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    const entry = result.current.picker?.entries.find(
      (one) => one.profileId === "p4",
    );

    act(() => result.current.picker?.pick(entry!));

    expect(result.current.confirmChange?.copy).toEqual(
      expect.objectContaining({ incomingCanNotify: false }),
    );
  });

  it("이미 배정된 사람을 고르면 겸임 안내 토스트가 선다", () => {
    const { result, input } = mounted();

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    const entry = result.current.picker?.entries.find(
      (one) => one.profileId === "p1",
    );

    act(() => result.current.picker?.pick(entry!));

    expect(result.current.toast).toContain("겸임");
    expect(input.onAddAssignment).not.toHaveBeenCalled();

    act(() => result.current.dismissToast());

    expect(result.current.toast).toBeNull();
  });

  it("자격 없는 사람은 자격 시트를 거치고 「자격도 주기」가 갈린다", () => {
    const { result, input } = mounted();

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    const entry = result.current.picker?.entries.find(
      (one) => one.profileId === "p3",
    );

    act(() => result.current.picker?.pick(entry!));

    expect(result.current.qualification?.name).toBe("최민서");
    expect(result.current.qualification?.position).toBe("스캔");

    act(() => result.current.qualification?.grant());

    expect(input.onGrantAndAssign).toHaveBeenCalledWith(
      {
        profileId: "p3",
        kind: "regular",
        slotId: "s2",
        skipQualification: true,
      },
      "스캔",
    );
  });

  it("「이번만」은 자격을 안 주고 배정만 한다", () => {
    const { result, input } = mounted();

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    const entry = result.current.picker?.entries.find(
      (one) => one.profileId === "p3",
    );

    act(() => result.current.picker?.pick(entry!));
    act(() => result.current.qualification?.once());

    expect(input.onGrantAndAssign).not.toHaveBeenCalled();
    expect(input.onAddAssignment).toHaveBeenCalledWith({
      profileId: "p3",
      kind: "regular",
      slotId: "s2",
      skipQualification: true,
    });
  });

  it("교육 붙이기는 자리 없는 픽커고 교육 배정으로 나간다", () => {
    const { result, input } = mounted();

    act(() => positionRow(result.current, "스캔").onPressEducation());

    const entry = result.current.picker?.entries.find(
      (one) => one.profileId === "p2",
    );

    act(() => result.current.picker?.pick(entry!));

    expect(input.onAddAssignment).toHaveBeenCalledWith({
      profileId: "p2",
      kind: "training",
      dayId: "d1",
      position: "스캔",
    });
  });

  it("요청 체크박스는 빈 자리 픽커에만 서고 고른 전원에게 한 번에 간다", () => {
    const { result, input } = mounted();

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    act(() => result.current.picker?.toggle("p4"));

    expect(result.current.picker?.picked).toEqual(["p4"]);

    act(() => result.current.picker?.send());

    expect(input.onSendWorkRequest).toHaveBeenCalledWith("s2", ["p4"]);
    expect(result.current.picker).toBeNull();
  });

  it("자리 시트의 바꾸기는 교체 픽커를 열고 빼기는 그 배정을 지운다", () => {
    const { result, input } = mounted();

    act(() => positionRow(result.current, "스캔").onPressSlot("s1"));
    act(() => result.current.slotSheet?.replace());

    expect(result.current.picker?.title).toContain("스캔");
    expect(result.current.slotSheet).toBeNull();

    const entry = result.current.picker?.entries.find(
      (one) => one.profileId === "p2",
    );

    act(() => result.current.picker?.pick(entry!));

    expect(input.onForceChange).toHaveBeenCalledWith("a1", "p2");

    act(() => positionRow(result.current, "스캔").onPressSlot("s1"));
    act(() => result.current.slotSheet?.remove());

    expect(input.onRemoveAssignment).toHaveBeenCalledWith("a1");
  });

  it("사람 보기 시트가 생일과 자격을 싣는다", () => {
    const { result } = mounted();

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    const entry = result.current.picker?.entries.find(
      (one) => one.profileId === "p2",
    );

    act(() => result.current.picker?.inspect(entry!));

    expect(result.current.person?.name).toBe("박수진");
    expect(result.current.person?.birthDate).toBe("1998-03-04");
    expect(result.current.person?.qualifications).toEqual(["스캔"]);

    act(() => result.current.person?.close());

    expect(result.current.person).toBeNull();
  });

  it("줄 머리끼리의 합침은 둘 다 풀려 있고 빈 자리가 있어야 받는다", () => {
    const { result, input } = mounted();

    expect(
      result.current.canDrop(positionDragId("스캔"), positionDragId("메인")),
    ).toBe(false);

    act(() => positionRow(result.current, "스캔").onToggleLock());
    act(() => positionRow(result.current, "메인").onToggleLock());

    expect(
      result.current.canDrop(positionDragId("스캔"), positionDragId("메인")),
    ).toBe(true);

    act(() =>
      result.current.drop(positionDragId("스캔"), positionDragId("메인")),
    );

    expect(input.onMergeSlots).toHaveBeenCalledWith("d1", "스캔", "메인");
  });

  it("자리 카드는 버리는 영역에만 가고 빈 자리는 바로 사라진다", () => {
    const { result, input } = mounted();

    expect(result.current.canDrop(slotDragId("s2"), DISCARD_DROP_ID)).toBe(
      true,
    );
    expect(
      result.current.canDrop(slotDragId("s2"), positionDragId("메인")),
    ).toBe(false);

    act(() => result.current.drop(slotDragId("s2"), DISCARD_DROP_ID));

    expect(input.onRemoveSlot).toHaveBeenCalledWith("s2");
    expect(result.current.discard).toBeNull();
  });

  it("사람이 든 자리를 버리면 확인 시트가 선다", () => {
    const { result, input } = mounted();

    act(() => result.current.drop(slotDragId("s1"), DISCARD_DROP_ID));

    expect(input.onRemoveSlot).not.toHaveBeenCalled();
    expect(result.current.discard?.name).toBe("이준호");

    act(() => result.current.discard?.confirm());

    expect(input.onRemoveSlot).toHaveBeenCalledWith("s1");
    expect(result.current.discard).toBeNull();
  });

  it("조정 시트에서 사람을 고르면 결근이 음수 분으로 간다", () => {
    const { result, input } = mounted();

    act(() => result.current.openAdjust());

    expect(result.current.adjust?.rows).toHaveLength(1);

    act(() => result.current.adjust?.pickPerson("p1"));

    expect(result.current.choice?.name).toBe("이준호");
    expect(result.current.choice?.assignedMinutes).toBeGreaterThan(0);

    act(() => result.current.choice?.absent());

    expect(input.onSetAdjustment).toHaveBeenCalledWith({
      profileId: "p1",
      minutes: -result.current.choice!.assignedMinutes,
      reason: "결근",
    });
  });

  it("연장과 원래대로는 사유만 갈린다", () => {
    const { result, input } = mounted({
      adjustments: [
        {
          profileId: "p1",
          minutes: 30,
          adjustedAt: "2026-10-10T09:00:00.000Z",
        },
      ],
    });

    act(() => result.current.openAdjust());
    act(() => result.current.adjust?.pickPerson("p1"));

    expect(result.current.choice?.canRevert).toBe(true);
    expect(result.current.choice?.extending).toBe(false);

    act(() => result.current.choice?.startExtending());

    expect(result.current.choice?.extending).toBe(true);
    expect(result.current.choice?.canSend).toBe(false);

    act(() => result.current.choice?.writeDigits("45분"));

    expect(result.current.choice?.digits).toBe("45");
    expect(result.current.choice?.canSend).toBe(true);

    act(() => result.current.choice?.extend());

    expect(input.onSetAdjustment).toHaveBeenCalledWith({
      profileId: "p1",
      minutes: 45,
      reason: "연장",
    });

    act(() => result.current.choice?.revert());

    expect(input.onSetAdjustment).toHaveBeenCalledWith({
      profileId: "p1",
      minutes: 0,
      reason: "원래대로",
    });
  });

  it("다른 사람을 고르면 적던 분이 남지 않는다", () => {
    const { result } = mounted();

    act(() => result.current.openAdjust());
    act(() => result.current.adjust?.pickPerson("p1"));
    act(() => result.current.choice?.startExtending());
    act(() => result.current.choice?.writeDigits("45"));
    act(() => result.current.adjust?.pickPerson("p1"));

    expect(result.current.choice?.extending).toBe(false);
    expect(result.current.choice?.digits).toBe("");
  });

  it("조정이 끝나면 고른 사람이 비워지고 훅도 비워진다", () => {
    const { result, input, rerender } = mounted();

    act(() => result.current.openAdjust());
    act(() => result.current.adjust?.pickPerson("p1"));

    expect(result.current.choice).not.toBeNull();

    rerender(inputOf({ ...input, adjusted: true }));

    expect(result.current.choice).toBeNull();
    expect(input.onAdjustSettled).toHaveBeenCalled();
    expect(input.onReloadDay).not.toHaveBeenCalled();
  });

  it("not_allowed면 목록을 다시 읽고 나머지 실패는 문구만 띄운다", () => {
    const { result, input, rerender } = mounted();

    act(() => result.current.openAdjust());
    act(() => result.current.adjust?.pickPerson("p1"));

    rerender(inputOf({ ...input, adjustError: new Error("끊겼다") }));

    expect(result.current.choice?.failureMessage).not.toBeNull();
    expect(input.onReloadDay).not.toHaveBeenCalled();

    rerender(
      inputOf({ ...input, adjustError: new DomainError("not_allowed") }),
    );

    expect(input.onReloadDay).toHaveBeenCalled();
    expect(result.current.choice).toBeNull();
  });

  it("열린 시트를 쌓인 순서대로 돌려준다", () => {
    const { result } = mounted();

    expect(result.current.sheets).toEqual([]);

    act(() => positionRow(result.current, "스캔").onPressSlot("s2"));

    expect(result.current.sheets.map((one) => one.kind)).toEqual(["picker"]);

    const entry = result.current.picker?.entries.find(
      (one) => one.profileId === "p2",
    );

    act(() => result.current.picker?.inspect(entry!));

    expect(result.current.sheets.map((one) => one.kind)).toEqual([
      "picker",
      "person",
    ]);

    act(() => result.current.sheets[1].dismiss());

    expect(result.current.sheets.map((one) => one.kind)).toEqual(["picker"]);
  });
});
