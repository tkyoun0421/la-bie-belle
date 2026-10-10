export type DayHoursSheetInput = {
  workDate: string;
  startsAt: string;
  endsAt: string;
  onDone: () => void;
};

export type DayHoursSheetController = {
  starts: string;
  ends: string;
  canSave: boolean;
  sending: boolean;
  failedLine: string | null;
  writeStarts: (typed: string) => void;
  writeEnds: (typed: string) => void;
  save: () => void;
};
