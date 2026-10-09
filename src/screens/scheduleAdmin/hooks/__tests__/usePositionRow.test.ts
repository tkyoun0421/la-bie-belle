import { jest } from "@jest/globals";

const { renderHook } = await import("@testing-library/react-native");
const { usePositionRow } =
  await import("@/screens/scheduleAdmin/hooks/usePositionRow");

type Input = Parameters<typeof usePositionRow>[0];

const SLOTS = [
  { id: "s1", positions: ["스캔"], endedAt: null },
  { id: "s2", positions: ["스캔", "메인"], endedAt: null },
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
  {
    id: "a2",
    slotId: null,
    position: "스캔",
    kind: "training",
    profileId: "p2",
    endedAt: null,
    name: "박수진",
  },
];

function input(over: Partial<Input> = {}): Input {
  return {
    position: "스캔",
    slots: SLOTS,
    assignments: ASSIGNMENTS,
    unlocked: false,
    canChangeStructure: true,
    nameOf: (profileId: string) => (profileId === "p1" ? "이준호" : "박수진"),
    requestBadgeOf: () => null,
    onToggleLock: jest.fn(),
    onPressEducation: jest.fn(),
    onPressSlot: jest.fn(),
    onAddSlot: jest.fn(),
    ...over,
  } as Input;
}

describe("usePositionRow — 줄 머리와 자리 카드를 controller가 완성한다", () => {
  it("채운 수와 전체 수를 한 문구로 낸다", () => {
    const { result } = renderHook(() => usePositionRow(input()));

    expect(result.current.head.position).toBe("스캔");
    expect(result.current.head.fillLabel).toBe("1/2");
    expect(result.current.head.fillTone).toBe("neutral");
  });

  it("다 채우면 머리 숫자가 흐려진다", () => {
    const { result } = renderHook(() =>
      usePositionRow(input({ slots: [SLOTS[0]] })),
    );

    expect(result.current.head.fillLabel).toBe("1/1");
    expect(result.current.head.fillTone).toBe("subtle");
  });

  it("배정된 자리는 이름을, 빈 자리는 빈 문구를 든다", () => {
    const { result } = renderHook(() => usePositionRow(input()));

    expect(result.current.slots[0].nameLine).toBe("이준호");
    expect(result.current.slots[0].variant).toBe("filled");
    expect(result.current.slots[0].nameTone).toBe("neutral");
    expect(result.current.slots[1].variant).toBe("empty");
    expect(result.current.slots[1].nameTone).toBe("subtle");
  });

  it("겸임 자리는 포지션 뱃지를 든다", () => {
    const { result } = renderHook(() => usePositionRow(input()));

    expect(result.current.slots[0].badges).toEqual([]);
    expect(result.current.slots[1].badges).toEqual([
      { label: "스캔·메인", variant: "brand" },
    ]);
  });

  it("기다리는 요청은 뱃지로 같이 선다", () => {
    const { result } = renderHook(() =>
      usePositionRow(input({ requestBadgeOf: () => "대기 2" })),
    );

    expect(result.current.slots[0].badges).toEqual([
      { label: "대기 2", variant: "neutral" },
    ]);
  });

  it("잠겨 있으면 끌 수도 없고 안내도 자리 추가도 없다", () => {
    const { result } = renderHook(() => usePositionRow(input()));

    expect(result.current.draggable).toBe(false);
    expect(result.current.showDragHint).toBe(false);
    expect(result.current.showAddSlot).toBe(false);
    expect(result.current.slots[0].draggable).toBe(false);
    expect(result.current.head.showHandle).toBe(false);
  });

  it("풀면 끌 수 있고 안내와 자리 추가가 선다", () => {
    const { result } = renderHook(() =>
      usePositionRow(input({ unlocked: true })),
    );

    expect(result.current.draggable).toBe(true);
    expect(result.current.showDragHint).toBe(true);
    expect(result.current.showAddSlot).toBe(true);
    expect(result.current.slots[0].draggable).toBe(true);
    expect(result.current.head.showHandle).toBe(true);
  });

  it("확정된 달은 잠금 버튼을 안 세운다", () => {
    const { result } = renderHook(() =>
      usePositionRow(input({ canChangeStructure: false })),
    );

    expect(result.current.head.showLock).toBe(false);
  });

  it("끌 식별자는 포지션과 자리에서 온다", () => {
    const { result } = renderHook(() => usePositionRow(input()));

    expect(result.current.dragId).toBe("position:스캔");
    expect(result.current.slots[0].dragId).toBe("slot:s1");
    expect(result.current.slots[0].testId).toBe("schedule-slot-스캔-1");
    expect(result.current.head.lockTestId).toBe("schedule-position-lock-스캔");
    expect(result.current.head.educationTestId).toBe(
      "schedule-education-button-스캔",
    );
  });

  it("이 포지션의 교육만 따로 센다", () => {
    const { result } = renderHook(() => usePositionRow(input()));

    expect(result.current.trainings).toEqual([
      { assignmentId: "a2", name: "박수진" },
    ]);
  });

  it("자리를 누르면 그 자리 id로 간다", () => {
    const onPressSlot = jest.fn();
    const { result } = renderHook(() => usePositionRow(input({ onPressSlot })));

    result.current.slots[1].press();

    expect(onPressSlot).toHaveBeenCalledWith("s2");
  });
});
