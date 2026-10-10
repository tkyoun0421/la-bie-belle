import {
  mergeTargetValidity,
  type MergeTargetAssignment,
  type MergeTargetInput,
} from "@/entities/schedule/model/mergeTarget.policy";
import type { ScheduleSlot } from "@/entities/schedule/model/schedule.type";

function slot(
  id: string,
  positions: string[],
  endedAt: string | null = null,
): ScheduleSlot {
  return { id, positions, endedAt };
}

function liveRegularAssignment(slotId: string): MergeTargetAssignment {
  return { slotId, kind: "regular", endedAt: null };
}

function baseInput(
  overrides: Partial<MergeTargetInput> = {},
): MergeTargetInput {
  return {
    slots: [slot("slot-from", ["매니저"]), slot("slot-to", ["안내"])],
    assignments: [],
    fromPosition: "매니저",
    toPosition: "안내",
    fromUnlocked: true,
    toUnlocked: true,
    ...overrides,
  };
}

describe("mergeTargetValidity — 양쪽에 빈 자리가 있고 둘 다 풀려 있으면 valid다", () => {
  it("valid를 낸다", () => {
    expect(mergeTargetValidity(baseInput())).toBe("valid");
  });
});

describe("mergeTargetValidity — 대상 쪽이 다 찼으면 no_empty_slot이다", () => {
  it("받는 쪽(toPosition) 자리가 이미 차 있으면 no_empty_slot이다", () => {
    const input = baseInput({
      assignments: [liveRegularAssignment("slot-to")],
    });

    expect(mergeTargetValidity(input)).toBe("no_empty_slot");
  });

  it("내주는 쪽(fromPosition) 자리가 이미 차 있으면 no_empty_slot이다", () => {
    const input = baseInput({
      assignments: [liveRegularAssignment("slot-from")],
    });

    expect(mergeTargetValidity(input)).toBe("no_empty_slot");
  });
});

describe("mergeTargetValidity — 두 줄 다 풀려 있어야 한다", () => {
  it("대상 줄이 잠겨 있으면 locked다", () => {
    const input = baseInput({ toUnlocked: false });

    expect(mergeTargetValidity(input)).toBe("locked");
  });

  it("집는 줄이 잠겨 있어도 locked다", () => {
    const input = baseInput({ fromUnlocked: false });

    expect(mergeTargetValidity(input)).toBe("locked");
  });

  it("둘 다 잠겨 있어도 locked다", () => {
    const input = baseInput({ fromUnlocked: false, toUnlocked: false });

    expect(mergeTargetValidity(input)).toBe("locked");
  });
});

describe("mergeTargetValidity — 빈 자리가 여러 개면 하나만 있어도 valid다", () => {
  it("한쪽에 빈 자리 둘, 다른 쪽 빈 자리 하나면 valid다", () => {
    const input = baseInput({
      slots: [
        slot("slot-from-1", ["매니저"]),
        slot("slot-from-2", ["매니저"]),
        slot("slot-to", ["안내"]),
      ],
      assignments: [liveRegularAssignment("slot-from-1")],
    });

    expect(mergeTargetValidity(input)).toBe("valid");
  });
});

describe("mergeTargetValidity — 닫힌 자리는 빈 자리로 안 친다", () => {
  it("살아 있는 자리가 없으면 no_empty_slot이다", () => {
    const input = baseInput({
      slots: [
        slot("slot-from", ["매니저"], "2026-10-09T00:00:00Z"),
        slot("slot-to", ["안내"]),
      ],
    });

    expect(mergeTargetValidity(input)).toBe("no_empty_slot");
  });
});
