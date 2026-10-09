import type { AdjustSheetRow } from "@/features/adjustment/model/adjustSheetRow.type";

export type AdjustSheetInput = {
  head: string;
  rows: readonly AdjustSheetRow[];
  onPickPerson: (profileId: string) => void;
};

export type AdjustSheetRowView = {
  profileId: string;
  name: string;
  accessibilityLabel: string;
  kindLabel: string | null;
  hoursLabel: string;
  rehearsalLine: string | null;
  divider: boolean;
  press: () => void;
};

export type AdjustSheetController = {
  head: string;
  showHelp: boolean;
  isEmpty: boolean;
  rows: readonly AdjustSheetRowView[];
};
