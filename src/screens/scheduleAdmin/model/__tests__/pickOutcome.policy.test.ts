import { pickOutcome } from "@/screens/scheduleAdmin/model/pickOutcome.policy";

const SLOT_TARGET = {
  position: "스캔",
  slotId: "s2",
  replacing: null,
};

const EDUCATION_TARGET = {
  position: "스캔",
  slotId: null,
  replacing: null,
};

const REPLACE_TARGET = {
  position: "스캔",
  slotId: "s1",
  replacing: {
    assignmentId: "a1",
    outgoingProfileId: "p1",
    outgoingName: "이준호",
  },
};

function entry(over: Record<string, unknown> = {}) {
  return {
    profileId: "p2",
    displayName: "박수진",
    category: "assignable" as const,
    checkbox: false,
    ...over,
  };
}

describe("pickOutcome — 체크박스가 붙은 줄은 요청에 담는다", () => {
  it("갈래가 무엇이든 담기만 한다", () => {
    expect(
      pickOutcome(
        SLOT_TARGET,
        entry({ category: "not_applied", checkbox: true }),
      ),
    ).toEqual({ kind: "toggle_request", profileId: "p2" });
  });
});

describe("pickOutcome — 넣을 수 없는 줄들", () => {
  it("신청 안 한 줄은 아무 일도 안 한다", () => {
    expect(
      pickOutcome(SLOT_TARGET, entry({ category: "not_applied" })),
    ).toEqual({ kind: "ignore" });
  });

  it("이미 배정된 줄은 겸임 안내로 간다", () => {
    expect(pickOutcome(SLOT_TARGET, entry({ category: "assigned" }))).toEqual({
      kind: "merge_instead",
    });
  });

  it("자격 없는 줄은 자격을 먼저 묻는다", () => {
    expect(
      pickOutcome(SLOT_TARGET, entry({ category: "not_qualified" })),
    ).toEqual({ kind: "needs_qualification" });
  });
});

describe("pickOutcome — 픽커가 나가는 것을 가른다", () => {
  it("자리 있는 픽커는 배정이다", () => {
    expect(pickOutcome(SLOT_TARGET, entry())).toEqual({
      kind: "change",
      change: {
        kind: "add",
        slotId: "s2",
        profileId: "p2",
        name: "박수진",
        skipQualification: false,
        grant: null,
      },
    });
  });

  it("자리 없는 픽커는 교육 배정이다", () => {
    expect(pickOutcome(EDUCATION_TARGET, entry())).toEqual({
      kind: "change",
      change: {
        kind: "training",
        position: "스캔",
        profileId: "p2",
        name: "박수진",
      },
    });
  });

  it("교체 픽커는 바꾸기다", () => {
    expect(pickOutcome(REPLACE_TARGET, entry())).toEqual({
      kind: "change",
      change: {
        kind: "swap",
        assignmentId: "a1",
        profileId: "p2",
        outgoingProfileId: "p1",
        outgoingName: "이준호",
        incomingName: "박수진",
      },
    });
  });

  it("교체 픽커에서는 자리가 있어도 바꾸기가 이긴다", () => {
    const outcome = pickOutcome(REPLACE_TARGET, entry());

    expect(outcome.kind === "change" && outcome.change.kind).toBe("swap");
  });
});
