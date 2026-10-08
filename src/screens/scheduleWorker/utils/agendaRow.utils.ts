import { spellDate } from "@/shared/utils/kstDate";

export type MyAssignment = {
  kind: "regular" | "training";
  position: string;
};

export type AgendaDay = {
  workDate: string;
  myAssignment: MyAssignment | null;
};

export function myAssignmentOf(
  assignments: readonly {
    position: string;
    kind: string;
    profile_id: string;
    ended_at: string | null;
  }[],
  profileId: string | null,
): MyAssignment | null {
  if (profileId === null) {
    return null;
  }

  const mine = assignments.filter(
    (assignment) =>
      assignment.profile_id === profileId && assignment.ended_at === null,
  );
  const chosen =
    mine.find((assignment) => assignment.kind === "regular") ?? mine[0];

  if (chosen === undefined) {
    return null;
  }

  return {
    kind: chosen.kind === "training" ? "training" : "regular",
    position: chosen.position,
  };
}

export function agendaRowStatusLabel(assignment: MyAssignment | null): string {
  if (assignment === null) {
    return "근무 없음";
  }

  return assignment.kind === "training"
    ? `교육 · ${assignment.position}`
    : assignment.position;
}

export function filterAgendaDays(
  days: readonly AgendaDay[],
  showMineOnly: boolean,
): AgendaDay[] {
  return days.filter((day) => !showMineOnly || day.myAssignment !== null);
}

export function spellWorkDate(workDate: string): string {
  return spellDate(workDate);
}
