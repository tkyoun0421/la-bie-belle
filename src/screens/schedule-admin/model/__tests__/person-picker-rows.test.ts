// 구현 대상: src/screens/schedule-admin/model/person-picker-rows.ts
//
// 사람 픽커의 「전체 보기」가 사람마다 매기는 상태 넷이다(schedule-admin.md 「사람 픽커
// 짜임」 표) — 배정 가능(신청했고, 그날 배정이 없고, 자격이 있다) / 신청 안 함 / 자격 없음
// / 배정됨. 자격은 `qualifications` 뷰가 낸 (profile_id, position) 행으로 판정한다
// (design.md 「자격」). 문구는 표 그대로다.

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
