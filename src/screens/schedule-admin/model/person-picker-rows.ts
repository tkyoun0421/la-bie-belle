/**
 * 사람 픽커의 「전체 보기」가 사람마다 매기는 상태다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「사람 픽커」 표와 「근무 요청
 * 보내기」 표고 문구는 「사람 픽커 문안」 그대로다.
 *
 * **배정됨이 가장 세다.** 그날 이미 든 사람은 왜 못 넣는지가 신청·자격·요청보다 앞서는
 * 사실이고, 그 줄을 누르면 「겸임은 자리를 합쳐 만드세요」로 이어진다(SCH-015).
 *
 * **자격은 뷰가 낸 행으로만 본다.** 「자격 부여 ∪ 살아 있는 교육 배정」을 여기서 다시 합치지
 * 않는다(`docs/2-design/modules/schedule/design.md`의 「자격」).
 *
 * **요청 상태는 미신청 줄에만 얹힌다.** 근무 요청이 신청 안 한 날을 채우는 유일한 길이라
 * (SCH-016) 요청이 나간 자리도 그 줄뿐이다. 메시지에 「요청」을 남기는 것은 같은 목록에
 * 「신청 안 함」이 서 있어서다 — 신청과 요청은 방향이 반대다.
 *
 * **만료됨은 저장하지 않는다.** `status = 'pending'`인데 `expires_at`이 서버 시각을 지난
 * 것이 만료된 갈래다(design.md 「요청」) — cron이 도는 사이 화면과 표가 어긋나지 않게
 * 화면이 그때그때 판정한다.
 *
 * **체크박스는 다시 보낼 수 있는 줄에만 붙는다.** 대기 중인 줄은 이미 나가 있는 요청이라
 * 다시 고를 것이 없고, 배정 가능한 줄은 눌러서 바로 넣는다.
 */

export type PickerCategory =
  | "assignable"
  | "not_applied"
  | "not_qualified"
  | "assigned"
  | "requested_pending"
  | "requested_declined"
  | "requested_expired";

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

export type PickerRequestCandidate = {
  profile_id: string;
  status: string;
  expires_at: string;
};

export type PersonPickerRowsInput = {
  position: string;
  members: readonly PickerMember[];
  appliedProfileIds: readonly string[];
  qualifiedProfileIds: readonly string[];
  dayAssignments: readonly PickerDayAssignment[];
  /** 이 자리에 살아 있는 요청의 갈래들. 요청이 없는 자리는 빈 배열이다. */
  requestCandidates?: readonly PickerRequestCandidate[];
  /** 만료를 가르는 기준 시각. 요청이 없으면 안 쓰이므로 기본값이 0이다. */
  serverNowMs?: number;
};

export type PickerRow = {
  profileId: string;
  displayName: string;
  category: PickerCategory;
  message: string | null;
  checkbox: boolean;
};

/** 나머지 넷 — 축가·안내·매니저·대기실 — 은 누구나 들어간다(SCH-013). */
export const RESTRICTED_POSITIONS = [
  "팀장",
  "스캔",
  "메인",
  "드레스",
  "드레스실",
] as const;

const REQUEST_MESSAGES: Record<string, string> = {
  requested_pending: "요청 대기 중",
  requested_declined: "요청 거절함",
  requested_expired: "요청 만료됨",
};

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

/** 미신청 줄에 얹힌 요청 상태다. 요청이 안 나갔으면 `null`이라 그 줄은 「신청 안 함」이다. */
function requestCategory(
  profileId: string,
  candidates: readonly PickerRequestCandidate[],
  serverNowMs: number,
): PickerCategory | null {
  const candidate = candidates.find((one) => one.profile_id === profileId);

  if (candidate === undefined) {
    return null;
  }

  if (candidate.status === "declined") {
    return "requested_declined";
  }

  if (candidate.status !== "pending") {
    return null;
  }

  return serverNowMs >= new Date(candidate.expires_at).getTime()
    ? "requested_expired"
    : "requested_pending";
}

export function classifyPickerRows(input: PersonPickerRowsInput): PickerRow[] {
  const applied = new Set(input.appliedProfileIds);
  const qualified = new Set(input.qualifiedProfileIds);
  const candidates = input.requestCandidates ?? [];
  const serverNowMs = input.serverNowMs ?? 0;
  const gated = RESTRICTED_POSITIONS.some(
    (position) => position === input.position,
  );

  return input.members.map((member) => {
    const named = {
      profileId: member.profileId,
      displayName: member.displayName,
    };
    const held = heldPosition(member.profileId, input.dayAssignments);

    if (held !== null) {
      return {
        ...named,
        category: "assigned",
        message: `${held}에 배정됨`,
        checkbox: false,
      };
    }

    if (!applied.has(member.profileId)) {
      const requested = requestCategory(
        member.profileId,
        candidates,
        serverNowMs,
      );

      if (requested !== null) {
        return {
          ...named,
          category: requested,
          message: REQUEST_MESSAGES[requested],
          checkbox: requested !== "requested_pending",
        };
      }

      return {
        ...named,
        category: "not_applied",
        message: "신청 안 함",
        checkbox: true,
      };
    }

    if (gated && !qualified.has(member.profileId)) {
      return {
        ...named,
        category: "not_qualified",
        message: `${input.position} 자격 없음`,
        checkbox: false,
      };
    }

    return {
      ...named,
      category: "assignable",
      message: null,
      checkbox: false,
    };
  });
}
