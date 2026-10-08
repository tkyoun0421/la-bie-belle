import { pickerEntries } from "@/screens/scheduleAdmin/model/pickerEntries.policy";

const MEMBERS = [
  {
    id: "p1",
    displayName: "이준호",
    photoUrl: "https://example.test/p1.png",
    gender: "male",
  },
  { id: "p2", displayName: "박수진", photoUrl: null, gender: "female" },
  { id: "p3", displayName: "최민서", photoUrl: null, gender: null },
  { id: "p4", displayName: null, photoUrl: null, gender: null },
];

const DAY_ASSIGNMENTS = [
  { profile_id: "p1", position: "스캔", kind: "regular", ended_at: null },
];

const QUALIFICATIONS = [
  { profileId: "p2", position: "스캔" },
  { profileId: "p3", position: "메인" },
];

const NOW_MS = Date.parse("2026-10-05T03:00:00.000Z");

function input(over: Record<string, unknown> = {}) {
  return {
    target: { position: "스캔", slotId: "s2", replacing: null },
    members: MEMBERS,
    appliedProfileIds: ["p1", "p2", "p3"],
    qualifications: QUALIFICATIONS,
    dayAssignments: DAY_ASSIGNMENTS,
    slotRequests: [],
    serverNowMs: NOW_MS,
    ...over,
  };
}

function rowOf(rows: ReturnType<typeof pickerEntries>, profileId: string) {
  const found = rows.find((one) => one.profileId === profileId);

  if (found === undefined) {
    throw new Error(`${profileId} 줄이 없다`);
  }

  return found;
}

describe("pickerEntries — 갈래에 얼굴과 성별이 얹힌다", () => {
  it("명단 순서 그대로 전원이 선다", () => {
    const rows = pickerEntries(input());

    expect(rows.map((row) => row.profileId)).toEqual(["p1", "p2", "p3", "p4"]);
  });

  it("갈래는 판정이 낸 그대로다", () => {
    const rows = pickerEntries(input());

    expect(rowOf(rows, "p1").category).toBe("assigned");
    expect(rowOf(rows, "p2").category).toBe("assignable");
    expect(rowOf(rows, "p3").category).toBe("not_qualified");
    expect(rowOf(rows, "p4").category).toBe("not_applied");
  });

  it("얼굴과 성별이 명단에서 온다", () => {
    const rows = pickerEntries(input());

    expect(rowOf(rows, "p1").photoUrl).toBe("https://example.test/p1.png");
    expect(rowOf(rows, "p1").gender).toBe("male");
    expect(rowOf(rows, "p2").photoUrl).toBeNull();
    expect(rowOf(rows, "p3").gender).toBeNull();
  });

  it("이름이 빈 사람도 줄이 선다", () => {
    expect(rowOf(pickerEntries(input()), "p4").displayName).toBe("");
  });

  it("자격은 그 포지션 것만 본다", () => {
    const rows = pickerEntries(
      input({ target: { position: "메인", slotId: "s3", replacing: null } }),
    );

    expect(rowOf(rows, "p2").category).toBe("not_qualified");
    expect(rowOf(rows, "p3").category).toBe("assignable");
  });
});

describe("pickerEntries — 체크박스는 빈 자리 픽커에만 선다", () => {
  it("빈 자리 픽커에서는 신청 안 한 줄에 선다", () => {
    expect(rowOf(pickerEntries(input()), "p4").checkbox).toBe(true);
  });

  it("교육 픽커에서는 떨어진다", () => {
    const rows = pickerEntries(
      input({ target: { position: "스캔", slotId: null, replacing: null } }),
    );

    expect(rowOf(rows, "p4").checkbox).toBe(false);
  });

  it("교체 픽커에서는 떨어진다", () => {
    const rows = pickerEntries(
      input({
        target: {
          position: "스캔",
          slotId: "s1",
          replacing: {
            assignmentId: "a1",
            outgoingProfileId: "p1",
            outgoingName: "이준호",
          },
        },
      }),
    );

    expect(rowOf(rows, "p4").checkbox).toBe(false);
  });
});

describe("pickerEntries — 요청은 그 자리 것만 읽는다", () => {
  const REQUEST = {
    slotId: "s2",
    candidates: [
      {
        profileId: "p4",
        status: "pending",
        expiresAt: "2026-10-06T00:00:00.000Z",
      },
    ],
  };

  it("그 자리에 나간 요청이 줄에 얹힌다", () => {
    const rows = pickerEntries(input({ slotRequests: [REQUEST] }));

    expect(rowOf(rows, "p4").category).toBe("requested_pending");
    expect(rowOf(rows, "p4").checkbox).toBe(false);
  });

  it("다른 자리의 요청은 안 읽는다", () => {
    const rows = pickerEntries(
      input({ slotRequests: [{ ...REQUEST, slotId: "s9" }] }),
    );

    expect(rowOf(rows, "p4").category).toBe("not_applied");
  });

  it("서버 시각을 지난 요청은 만료로 읽는다", () => {
    const rows = pickerEntries(
      input({
        slotRequests: [REQUEST],
        serverNowMs: Date.parse("2026-10-07T00:00:00.000Z"),
      }),
    );

    expect(rowOf(rows, "p4").category).toBe("requested_expired");
  });

  it("자리 없는 픽커는 요청을 아예 안 찾는다", () => {
    const rows = pickerEntries(
      input({
        target: { position: "스캔", slotId: null, replacing: null },
        slotRequests: [REQUEST],
      }),
    );

    expect(rowOf(rows, "p4").category).toBe("not_applied");
  });
});
