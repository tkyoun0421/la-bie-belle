export type CancellationImpactInput = {
  assignedWorkerCount: number;
  traineeCounts: Record<string, number>;
};

export function computeCancellationImpact(input: CancellationImpactInput): number {
  const traineeTotal = Object.values(input.traineeCounts).reduce((sum, count) => sum + count, 0);
  return input.assignedWorkerCount + traineeTotal;
}
