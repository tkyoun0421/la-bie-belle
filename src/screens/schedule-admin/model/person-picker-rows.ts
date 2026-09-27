/**
 * 사람 픽커의 「전체 보기」가 사람마다 매기는 상태 넷이다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「사람 픽커」 표고 문구는
 * 「사람 픽커 문안」 그대로다.
 *
 * **배정됨이 가장 세다.** 그날 이미 든 사람은 왜 못 넣는지가 신청·자격보다 앞서는 사실이고,
 * 그 줄을 누르면 「겸임은 자리를 합쳐 만드세요」로 이어진다(SCH-015).
 *
 * **자격은 뷰가 낸 행으로만 본다.** 「자격 부여 ∪ 살아 있는 교육 배정」을 여기서 다시 합치지
 * 않는다(`docs/2-design/modules/schedule/design.md`의 「자격」).
 */

export type PickerCategory =
  "assignable" | "not_applied" | "not_qualified" | "assigned";

export type PickerMember = {
  profileId: string;
  displayName: string;
};

export type PickerDayAssignment = {
  profile_id: string;
  position: string;
  kind: string;
  ended_at: string | null;
};

export type PersonPickerRowsInput = {
  position: string;
  members: readonly PickerMember[];
  appliedProfileIds: readonly string[];
  qualifiedProfileIds: readonly string[];
  dayAssignments: readonly PickerDayAssignment[];
};

export type PickerRow = {
  profileId: string;
  displayName: string;
  category: PickerCategory;
  message: string | null;
};

/** 나머지 넷 — 축가·안내·매니저·대기실 — 은 누구나 들어간다(SCH-013). */
export const RESTRICTED_POSITIONS = [
  "팀장",
  "스캔",
  "메인",
  "드레스",
  "드레스실",
] as const;

function heldPosition(
  profileId: string,
  dayAssignments: readonly PickerDayAssignment[],
): string | null {
  return (
    dayAssignments.find(
      (assignment) =>
        assignment.profile_id === profileId &&
        assignment.kind === "regular" &&
        assignment.ended_at === null,
    )?.position ?? null
  );
}

export function classifyPickerRows(input: PersonPickerRowsInput): PickerRow[] {
  const applied = new Set(input.appliedProfileIds);
  const qualified = new Set(input.qualifiedProfileIds);
  const gated = RESTRICTED_POSITIONS.some(
    (position) => position === input.position,
  );

  return input.members.map((member) => {
    const held = heldPosition(member.profileId, input.dayAssignments);

    if (held !== null) {
      return {
        profileId: member.profileId,
        displayName: member.displayName,
        category: "assigned",
        message: `${held}에 배정됨`,
      };
    }

    if (!applied.has(member.profileId)) {
      return {
        profileId: member.profileId,
        displayName: member.displayName,
        category: "not_applied",
        message: "신청 안 함",
      };
    }

    if (gated && !qualified.has(member.profileId)) {
      return {
        profileId: member.profileId,
        displayName: member.displayName,
        category: "not_qualified",
        message: `${input.position} 자격 없음`,
      };
    }

    return {
      profileId: member.profileId,
      displayName: member.displayName,
      category: "assignable",
      message: null,
    };
  });
}
