// 구현 대상: src/screens/schedule-admin/model/person-picker-rows.ts
//
// 사람 픽커의 「전체 보기」가 사람마다 매기는 상태 넷이다(schedule-admin.md 「사람 픽커
// 짜임」 표) — 배정 가능(신청했고, 그날 배정이 없고, 자격이 있다) / 신청 안 함 / 자격 없음
// / 배정됨. 자격은 `qualifications` 뷰가 낸 (profile_id, position) 행으로 판정한다
// (design.md 「자격」). 문구는 표 그대로다.
//
// 확장 — 미신청 줄에 근무 요청 상태가 얹힌다(schedule-admin.md 「근무 요청 보내기」).
// 대기 중·거절함·만료됨 셋이고, 만료는 저장하지 않으니(design.md 「요청」) `expires_at`과
// `serverNowMs`를 견줘 화면이 파생한다. 체크박스는 대기 중에만 없다 — 이미 나간 요청이라
// 다시 고를 것이 없다.

import {
  RESTRICTED_POSITIONS,
  classifyPickerRows,
  type PersonPickerRowsInput,
} from "@/screens/schedule-admin/model/person-picker-rows";

const MEMBERS = [
  { profileId: "profile-1", displayName: "박서연" },
  { profileId: "profile-2", displayName: "김지우" },
  { profileId: "profile-3", displayName: "이하늘" },
];

function baseInput(
  overrides: Partial<PersonPickerRowsInput> = {},
): PersonPickerRowsInput {
  return {
    position: "스캔",
    members: MEMBERS,
    appliedProfileIds: MEMBERS.map((m) => m.profileId),
    qualifiedProfileIds: MEMBERS.map((m) => m.profileId),
    dayAssignments: [],
    ...overrides,
  };
}

describe("RESTRICTED_POSITIONS — README SCH-013의 제한 포지션 다섯이다", () => {
  it("팀장·스캔·메인·드레스·드레스실이다", () => {
    expect(RESTRICTED_POSITIONS).toEqual([
      "팀장",
      "스캔",
      "메인",
      "드레스",
      "드레스실",
    ]);
  });
});

describe("classifyPickerRows — 배정 가능은 신청했고 배정 없고 자격 있는 사람이다", () => {
  it("셋 다 만족하면 assignable이고 상태 메시지가 없다", () => {
    const rows = classifyPickerRows(baseInput());
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("assignable");
    expect(row?.message).toBeNull();
  });
});

describe("classifyPickerRows — 미신청 줄은 「신청 안 함」이다", () => {
  it("그날 신청 목록에 없으면 not_applied다", () => {
    const rows = classifyPickerRows(
      baseInput({ appliedProfileIds: ["profile-2", "profile-3"] }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("not_applied");
    expect(row?.message).toBe("신청 안 함");
  });
});

describe("classifyPickerRows — 제한 포지션에 자격 없는 사람은 「{포지션} 자격 없음」이다", () => {
  it("스캔 자격이 없으면 「스캔 자격 없음」이다", () => {
    const rows = classifyPickerRows(
      baseInput({ position: "스캔", qualifiedProfileIds: ["profile-2"] }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("not_qualified");
    expect(row?.message).toBe("스캔 자격 없음");
  });

  it("기본 포지션(안내)은 자격 없음이 안 생긴다", () => {
    const rows = classifyPickerRows(
      baseInput({ position: "안내", qualifiedProfileIds: [] }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("assignable");
  });
});

describe("classifyPickerRows — 그날 이미 배정된 사람은 「{포지션}에 배정됨」이다", () => {
  it("팀장에 배정돼 있으면 「팀장에 배정됨」이다", () => {
    const rows = classifyPickerRows(
      baseInput({
        dayAssignments: [
          {
            profile_id: "profile-1",
            position: "팀장",
            kind: "regular",
            ended_at: null,
          },
        ],
      }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("assigned");
    expect(row?.message).toBe("팀장에 배정됨");
  });

  it("배정됨이 미신청·자격 없음보다 우선한다", () => {
    const rows = classifyPickerRows(
      baseInput({
        appliedProfileIds: [],
        qualifiedProfileIds: [],
        dayAssignments: [
          {
            profile_id: "profile-1",
            position: "팀장",
            kind: "regular",
            ended_at: null,
          },
        ],
      }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("assigned");
  });

  it("닫힌(ended_at 있는) 배정은 배정됨으로 안 친다", () => {
    const rows = classifyPickerRows(
      baseInput({
        dayAssignments: [
          {
            profile_id: "profile-1",
            position: "팀장",
            kind: "regular",
            ended_at: "2026-10-09T00:00:00Z",
          },
        ],
      }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("assignable");
  });

  it("교육 배정은 정규 자리를 안 먹으므로 배정됨으로 안 친다", () => {
    const rows = classifyPickerRows(
      baseInput({
        dayAssignments: [
          {
            profile_id: "profile-1",
            position: "팀장",
            kind: "training",
            ended_at: null,
          },
        ],
      }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("assignable");
  });
});

const SERVER_NOW_MS = new Date("2026-10-10T00:00:00Z").getTime();

describe("classifyPickerRows — 근무 요청을 안 보낸 미신청자는 그대로 「신청 안 함」이고 체크박스가 붙는다", () => {
  it("requestCandidates에 없는 미신청자는 checkbox: true다", () => {
    const rows = classifyPickerRows(
      baseInput({
        appliedProfileIds: ["profile-2", "profile-3"],
        requestCandidates: [],
        serverNowMs: SERVER_NOW_MS,
      }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("not_applied");
    expect(row?.message).toBe("신청 안 함");
    expect(row?.checkbox).toBe(true);
  });
});

describe("classifyPickerRows — 대기 중인 근무 요청은 체크박스가 없다", () => {
  it("pending 후보는 「요청 대기 중」이고 checkbox: false다", () => {
    const rows = classifyPickerRows(
      baseInput({
        appliedProfileIds: ["profile-2", "profile-3"],
        requestCandidates: [
          {
            profile_id: "profile-1",
            status: "pending",
            expires_at: "2026-10-12T00:00:00Z",
          },
        ],
        serverNowMs: SERVER_NOW_MS,
      }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("requested_pending");
    expect(row?.message).toBe("요청 대기 중");
    expect(row?.checkbox).toBe(false);
  });
});

describe("classifyPickerRows — 거절한 근무 요청은 체크박스가 붙어 다시 보낸다", () => {
  it("declined 후보는 「요청 거절함」이고 checkbox: true다", () => {
    const rows = classifyPickerRows(
      baseInput({
        appliedProfileIds: ["profile-2", "profile-3"],
        requestCandidates: [
          {
            profile_id: "profile-1",
            status: "declined",
            expires_at: "2026-10-12T00:00:00Z",
          },
        ],
        serverNowMs: SERVER_NOW_MS,
      }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("requested_declined");
    expect(row?.message).toBe("요청 거절함");
    expect(row?.checkbox).toBe(true);
  });
});

describe("classifyPickerRows — 만료됨은 저장하지 않는다, expires_at과 serverNowMs를 견줘 화면이 판정한다", () => {
  it("pending인데 expires_at이 serverNowMs보다 이르면 「요청 만료됨」이고 checkbox: true다", () => {
    const rows = classifyPickerRows(
      baseInput({
        appliedProfileIds: ["profile-2", "profile-3"],
        requestCandidates: [
          {
            profile_id: "profile-1",
            status: "pending",
            expires_at: "2026-10-09T00:00:00Z",
          },
        ],
        serverNowMs: SERVER_NOW_MS,
      }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("requested_expired");
    expect(row?.message).toBe("요청 만료됨");
    expect(row?.checkbox).toBe(true);
  });

  it("pending이고 expires_at이 아직 안 지났으면 만료가 아니다", () => {
    const rows = classifyPickerRows(
      baseInput({
        appliedProfileIds: ["profile-2", "profile-3"],
        requestCandidates: [
          {
            profile_id: "profile-1",
            status: "pending",
            expires_at: "2026-10-11T00:00:00Z",
          },
        ],
        serverNowMs: SERVER_NOW_MS,
      }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("requested_pending");
  });
});

describe("classifyPickerRows — 배정됨이 근무 요청 상태보다 우선한다", () => {
  it("그날 이미 배정된 사람은 pending 후보가 있어도 assigned다", () => {
    const rows = classifyPickerRows(
      baseInput({
        appliedProfileIds: ["profile-2", "profile-3"],
        requestCandidates: [
          {
            profile_id: "profile-1",
            status: "pending",
            expires_at: "2026-10-12T00:00:00Z",
          },
        ],
        serverNowMs: SERVER_NOW_MS,
        dayAssignments: [
          {
            profile_id: "profile-1",
            position: "팀장",
            kind: "regular",
            ended_at: null,
          },
        ],
      }),
    );
    const row = rows.find((r) => r.profileId === "profile-1");

    expect(row?.category).toBe("assigned");
  });
});
