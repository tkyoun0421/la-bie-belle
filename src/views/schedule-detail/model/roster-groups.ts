import type { ConfirmedRosterRow } from "@/entities/schedule/model/confirmed-roster";

export type RosterMember = {
  name: string;
  isSelf: boolean;
  displayIndex: number;
};

export type PositionRosterGroup = {
  positionName: string;
  sortOrder: number;
  regular: RosterMember[];
  trainees: RosterMember[];
};

type UnindexedRosterMember = Omit<RosterMember, "displayIndex">;
type UnindexedPositionRosterGroup = {
  positionName: string;
  sortOrder: number;
  regular: UnindexedRosterMember[];
  trainees: UnindexedRosterMember[];
};

function withDisplayIndex(groups: UnindexedPositionRosterGroup[]): PositionRosterGroup[] {
  const flatMembers = groups.flatMap((group) => [...group.regular, ...group.trainees]);
  const displayIndexByPosition = new Map(flatMembers.map((member, index) => [member, index]));

  return groups.map((group) => ({
    ...group,
    regular: group.regular.map((member) => ({
      ...member,
      displayIndex: displayIndexByPosition.get(member)!,
    })),
    trainees: group.trainees.map((member) => ({
      ...member,
      displayIndex: displayIndexByPosition.get(member)!,
    })),
  }));
}

export function buildRosterGroups(rows: ConfirmedRosterRow[]): PositionRosterGroup[] {
  const groups = new Map<string, UnindexedPositionRosterGroup>();

  for (const row of rows) {
    const existing = groups.get(row.positionName);
    const group =
      existing ??
      ({
        positionName: row.positionName,
        sortOrder: row.sortOrder,
        regular: [],
        trainees: [],
      } satisfies UnindexedPositionRosterGroup);

    if (!existing) {
      groups.set(row.positionName, group);
    }

    const member: UnindexedRosterMember = { name: row.name, isSelf: row.isSelf };
    if (row.isTrainee) {
      group.trainees.push(member);
    } else {
      group.regular.push(member);
    }
  }

  const sortedGroups = Array.from(groups.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder || a.positionName.localeCompare(b.positionName, "ko"),
  );

  return withDisplayIndex(sortedGroups);
}

export type MyRosterPosition = {
  positionName: string;
  isTrainee: boolean;
};

export function deriveMyRosterPositions(rows: ConfirmedRosterRow[]): MyRosterPosition[] {
  return rows
    .filter((row) => row.isSelf)
    .map((row) => ({ positionName: row.positionName, isTrainee: row.isTrainee }));
}
