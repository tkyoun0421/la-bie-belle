/**
 * 날 시트와 아코디언 펼침이 같이 쓰는 명단이다
 * (`docs/2-design/modules/schedule/screens/schedule-worker.md`의 「날 시트 짜임」).
 *
 * **자리와 사람이 다른 것이다.** 정규 배정은 자리 하나를 먹고, 자리가 남으면 그 줄이 「빈
 * 자리」로 서고, 교육 배정은 자리를 안 먹고 그 포지션 끝에 덧붙는다
 * ([ATT-020](../../../../docs/2-design/modules/attendance/README.md#att-020)). 그래서 명단
 * 길이가 자리 수보다 길어질 수 있다.
 *
 * **순서는 포지션 정본 순서다** — 이름순도 배정순도 아니다. 같은 날을 여럿이 볼 때 줄 자리가
 * 같아야 서로 「위에서 세 번째」로 말한다.
 */

export const POSITION_ORDER = [
  "팀장",
  "스캔",
  "메인",
  "드레스",
  "축가",
  "매니저",
  "안내",
  "드레스실",
  "대기실",
] as const;

export type RosterSlot = {
  position: string;
  capacity: number;
};

export type RosterAssignment = {
  position: string;
  kind: "regular" | "training";
  profileId: string;
  displayName: string;
};

export type RosterRow = RosterAssignment | { kind: "vacant"; position: string };

/** 정본 순서 밖의 포지션은 뒤에 붙는다 — 홀 기본값이 바뀌어도 명단이 그 사람을 안 지운다. */
function positionRank(position: string): number {
  const at = (POSITION_ORDER as readonly string[]).indexOf(position);

  return at === -1 ? POSITION_ORDER.length : at;
}

function orderedPositions(
  slots: readonly RosterSlot[],
  assignments: readonly RosterAssignment[],
): string[] {
  const seen = [
    ...slots.map((slot) => slot.position),
    ...assignments.map((assignment) => assignment.position),
  ];

  return [...new Set(seen)].sort(
    (left, right) => positionRank(left) - positionRank(right),
  );
}

export function buildRoster(
  slots: readonly RosterSlot[],
  assignments: readonly RosterAssignment[],
): RosterRow[] {
  return orderedPositions(slots, assignments).flatMap((position) => {
    const here = assignments.filter(
      (assignment) => assignment.position === position,
    );
    const regulars = here.filter((assignment) => assignment.kind === "regular");
    const trainings = here.filter(
      (assignment) => assignment.kind === "training",
    );
    const capacity = slots
      .filter((slot) => slot.position === position)
      .reduce((total, slot) => total + slot.capacity, 0);
    const vacancies = Math.max(0, capacity - regulars.length);

    return [
      ...regulars,
      ...Array.from({ length: vacancies }, () => ({
        kind: "vacant" as const,
        position,
      })),
      ...trainings,
    ];
  });
}

/** 부제의 인원이다. 빈 자리는 사람이 아니고 교육은 사람이다. */
export function rosterHeadcount(roster: readonly RosterRow[]): number {
  return roster.filter((row) => row.kind !== "vacant").length;
}

export type ShiftActionsInput = {
  isMyAssignment: boolean;
  workDate: string;
  today: string;
  hasActiveCancelRequest?: boolean;
};

/**
 * 「근무 취소」·「교대 요청」을 지금 누를 수 있는 날이다. 근무 당일부터는 바꿀 시간이 없어
 * 닫히고, 지난 날은 조회만이다.
 *
 * **요청 중에도 닫힌다.** 같은 근무에 교대와 취소를 겹쳐 거는 길을 안 둔다
 * (`docs/2-design/modules/schedule/screens/schedule-worker.md`의 「보낸 뒤」) — 그때 버튼은
 * 사라지지 않고 비활성으로 남고 옆에 「취소 요청 중」 배지가 선다.
 */
export function canShowShiftActions({
  isMyAssignment,
  workDate,
  today,
  hasActiveCancelRequest = false,
}: ShiftActionsInput): boolean {
  return isMyAssignment && today < workDate && !hasActiveCancelRequest;
}

/**
 * 읽어 온 하루를 명단으로 옮긴다. 끝난 자리와 끝난 배정은 빼고 센다 — 강제 변경으로 닫힌
 * 자리가 「빈 자리」로 남으면 아직 사람을 구하는 중으로 읽힌다.
 *
 * 자리 하나가 `slots` 한 행이라 같은 포지션의 행 수가 곧 그 포지션의 자리 수다.
 */
export function rosterOfDay(day: {
  slots: readonly { positions: string[]; ended_at: string | null }[];
  assignments: readonly {
    position: string;
    kind: string;
    profile_id: string;
    ended_at: string | null;
    profiles: { display_name: string | null } | null;
  }[];
}): RosterRow[] {
  const seats = day.slots
    .filter((slot) => slot.ended_at === null)
    .map((slot) => ({ position: slot.positions[0] ?? "", capacity: 1 }));

  const taken = day.assignments
    .filter((assignment) => assignment.ended_at === null)
    .map((assignment) => ({
      position: assignment.position,
      kind:
        assignment.kind === "training"
          ? ("training" as const)
          : ("regular" as const),
      profileId: assignment.profile_id,
      displayName: assignment.profiles?.display_name ?? "",
    }));

  return buildRoster(seats, taken);
}

/** 「10:00 – 18:00 · 11명」이다. 시각은 `HH:MM:SS`로 와서 초를 버린다. */
export function daySheetSubtitle(
  startsAt: string,
  endsAt: string,
  headcount: number,
): string {
  return `${startsAt.slice(0, 5)} – ${endsAt.slice(0, 5)} · ${headcount}명`;
}
