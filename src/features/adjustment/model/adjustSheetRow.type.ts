export type AdjustmentKind = "결근" | "연장";

export type AdjustSheetRow = {
  profileId: string;
  name: string;
  finalMinutes: number;
  adjustmentKind: AdjustmentKind | null;
  rehearsalLine: string | null;
};
