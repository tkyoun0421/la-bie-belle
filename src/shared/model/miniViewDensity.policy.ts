export type MiniViewDensityInput = {
  isOpen: boolean;
  assignedCount: number;
  maxAssignedCount: number;
};

export function miniViewDensity({
  isOpen,
  assignedCount,
  maxAssignedCount,
}: MiniViewDensityInput): number | null {
  if (!isOpen) {
    return null;
  }

  if (maxAssignedCount <= 0) {
    return 0;
  }

  return assignedCount / maxAssignedCount;
}

export type MiniViewDay = {
  workDate: string;
  assignedCount: number;
};

export function miniViewLoads(
  days: readonly MiniViewDay[],
): Record<number, { load: number }> {
  const maxAssignedCount = days.reduce(
    (most, day) => Math.max(most, day.assignedCount),
    0,
  );

  const loads: Record<number, { load: number }> = {};

  for (const day of days) {
    const load = miniViewDensity({
      isOpen: true,
      assignedCount: day.assignedCount,
      maxAssignedCount,
    });

    if (load !== null) {
      loads[Number(day.workDate.slice(8, 10))] = { load };
    }
  }

  return loads;
}
