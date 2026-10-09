import type { ScheduleAssignment } from "@/entities/schedule/model/schedule.type";
import type { SlotRequestCandidate } from "@/entities/workRequest/model/workRequest.type";
import { RESTRICTED_POSITIONS } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";

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

export type PickerDayAssignment = Pick<
  ScheduleAssignment,
  "profileId" | "position" | "kind" | "endedAt"
>;

export type PickerRequestCandidate = SlotRequestCandidate;

export type PersonPickerRowsInput = {
  position: string;
  members: readonly PickerMember[];
  appliedProfileIds: readonly string[];
  qualifiedProfileIds: readonly string[];
  dayAssignments: readonly PickerDayAssignment[];
  requestCandidates?: readonly PickerRequestCandidate[];
  serverNowMs?: number;
};

export type PickerRow = {
  profileId: string;
  displayName: string;
  category: PickerCategory;
  message: string | null;
  checkbox: boolean;
};

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
        assignment.profileId === profileId &&
        assignment.kind === "regular" &&
        assignment.endedAt === null,
    )?.position ?? null
  );
}

function requestCategory(
  profileId: string,
  candidates: readonly PickerRequestCandidate[],
  serverNowMs: number,
): PickerCategory | null {
  const candidate = candidates.find((one) => one.profileId === profileId);

  if (candidate === undefined) {
    return null;
  }

  if (candidate.status === "declined") {
    return "requested_declined";
  }

  if (candidate.status !== "pending") {
    return null;
  }

  return serverNowMs >= new Date(candidate.expiresAt).getTime()
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
