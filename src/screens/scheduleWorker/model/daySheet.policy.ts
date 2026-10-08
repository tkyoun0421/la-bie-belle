import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";

export { POSITION_ORDER };

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

export function rosterHeadcount(roster: readonly RosterRow[]): number {
  return roster.filter((row) => row.kind !== "vacant").length;
}

export type ShiftActionsInput = {
  isMyAssignment: boolean;
  workDate: string;
  today: string;
  hasActiveCancelRequest?: boolean;
};

export function canShowShiftActions({
  isMyAssignment,
  workDate,
  today,
  hasActiveCancelRequest = false,
}: ShiftActionsInput): boolean {
  return isMyAssignment && today < workDate && !hasActiveCancelRequest;
}

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

export function daySheetSubtitle(
  startsAt: string,
  endsAt: string,
  headcount: number,
): string {
  return `${startsAt.slice(0, 5)} – ${endsAt.slice(0, 5)} · ${headcount}명`;
}
