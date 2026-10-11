export type MiniViewDensityInput = {
  isOpen: boolean;
  assignedCount: number;
  maxAssignedCount: number;
};

type MiniViewLoadInput = Omit<MiniViewDensityInput, "isOpen">;

function loadOf({
  assignedCount,
  maxAssignedCount,
}: MiniViewLoadInput): number {
  return maxAssignedCount <= 0 ? 0 : assignedCount / maxAssignedCount;
}

export function miniViewDensity({
  isOpen,
  ...day
}: MiniViewDensityInput): number | null {
  return isOpen ? loadOf(day) : null;
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

  return Object.fromEntries(
    days.map((day): [number, { load: number }] => [
      Number(day.workDate.slice(8, 10)),
      { load: loadOf({ assignedCount: day.assignedCount, maxAssignedCount }) },
    ]),
  );
}
