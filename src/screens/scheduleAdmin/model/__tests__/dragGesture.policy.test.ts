import { DISCARD_DROP_ID } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import {
  canDropOnTarget,
  dropOutcome,
} from "@/screens/scheduleAdmin/model/dragGesture.policy";
import {
  positionDragId,
  slotDragId,
} from "@/screens/scheduleAdmin/utils/dragId.utils";

const SLOTS = [
  { id: "s1", positions: ["스캔"], ended_at: null },
  { id: "s2", positions: ["스캔"], ended_at: null },
  { id: "s3", positions: ["메인"], ended_at: null },
];

const ASSIGNMENTS = [
  {
    id: "a1",
    slot_id: "s1",
    kind: "regular",
    ended_at: null,
    profile_id: "p1",
  },
];

function dropInput(over: Record<string, unknown> = {}) {
  return {
    dragId: positionDragId("스캔"),
    dropId: positionDragId("메인"),
    slots: SLOTS,
    assignments: ASSIGNMENTS,
    unlockedPositions: ["스캔", "메인"],
    ...over,
  };
}

describe("canDropOnTarget — 자리 카드는 버리는 영역에만 간다", () => {
  it("버리는 영역이면 받는다", () => {
    expect(
      canDropOnTarget(
        dropInput({ dragId: slotDragId("s2"), dropId: DISCARD_DROP_ID }),
      ),
    ).toBe(true);
  });

  it("줄 머리에는 안 간다", () => {
    expect(
      canDropOnTarget(
        dropInput({
          dragId: slotDragId("s2"),
          dropId: positionDragId("메인"),
        }),
      ),
    ).toBe(false);
  });
});

describe("canDropOnTarget — 줄 머리끼리는 합침 규칙을 탄다", () => {
  it("양쪽이 풀려 있고 빈 자리가 있으면 받는다", () => {
    expect(canDropOnTarget(dropInput())).toBe(true);
  });

  it("한쪽이라도 잠겨 있으면 거절한다", () => {
    expect(canDropOnTarget(dropInput({ unlockedPositions: ["스캔"] }))).toBe(
      false,
    );
  });

  it("받는 쪽에 빈 자리가 없으면 거절한다", () => {
    expect(
      canDropOnTarget(
        dropInput({
          assignments: [
            ...ASSIGNMENTS,
            {
              id: "a2",
              slot_id: "s3",
              kind: "regular",
              ended_at: null,
              profile_id: "p2",
            },
          ],
        }),
      ),
    ).toBe(false);
  });

  it("버리는 영역을 줄 머리로 읽지 않는다", () => {
    expect(
      canDropOnTarget(
        dropInput({ dragId: positionDragId("스캔"), dropId: DISCARD_DROP_ID }),
      ),
    ).toBe(false);
  });
});

describe("dropOutcome — 놓인 뒤 무엇이 일어나나", () => {
  it("줄 머리끼리면 합침이다", () => {
    expect(
      dropOutcome({
        dragId: positionDragId("스캔"),
        dropId: positionDragId("메인"),
        assignments: ASSIGNMENTS,
      }),
    ).toEqual({ kind: "merge", fromPosition: "스캔", toPosition: "메인" });
  });

  it("빈 자리를 버리면 바로 지운다", () => {
    expect(
      dropOutcome({
        dragId: slotDragId("s2"),
        dropId: DISCARD_DROP_ID,
        assignments: ASSIGNMENTS,
      }),
    ).toEqual({ kind: "remove", slotId: "s2" });
  });

  it("사람이 든 자리를 버리면 확인을 먼저 받는다", () => {
    expect(
      dropOutcome({
        dragId: slotDragId("s1"),
        dropId: DISCARD_DROP_ID,
        assignments: ASSIGNMENTS,
      }),
    ).toEqual({ kind: "confirm", slotId: "s1", profileId: "p1" });
  });

  it("끝난 배정만 있는 자리는 사람이 없는 것으로 읽는다", () => {
    expect(
      dropOutcome({
        dragId: slotDragId("s1"),
        dropId: DISCARD_DROP_ID,
        assignments: [
          {
            id: "a1",
            slot_id: "s1",
            kind: "regular",
            ended_at: "2026-10-01T00:00:00Z",
            profile_id: "p1",
          },
        ],
      }),
    ).toEqual({ kind: "remove", slotId: "s1" });
  });

  it("꼴을 모르는 짝이면 아무 일도 안 한다", () => {
    expect(
      dropOutcome({
        dragId: DISCARD_DROP_ID,
        dropId: positionDragId("메인"),
        assignments: ASSIGNMENTS,
      }),
    ).toEqual({ kind: "none" });
  });
});
