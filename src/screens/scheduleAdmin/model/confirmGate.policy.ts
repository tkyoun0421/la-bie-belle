export type DayConfirmGate =
  "before_confirm" | "confirmed_original" | "confirmed_reopened";

export type DayConfirmGateInput = {
  openedAt: string;
  confirmedAt: string | null;
};

export function dayConfirmGate(input: DayConfirmGateInput): DayConfirmGate {
  if (input.confirmedAt === null) {
    return "before_confirm";
  }

  return input.openedAt > input.confirmedAt
    ? "confirmed_reopened"
    : "confirmed_original";
}

export function allowsStructureChange(gate: DayConfirmGate): boolean {
  return gate !== "confirmed_original";
}
