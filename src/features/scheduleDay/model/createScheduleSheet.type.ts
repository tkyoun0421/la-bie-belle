export type CreateScheduleSheetInput = {
  month: string;
  today: string;
  onDone: () => void;
};

export type CreateScheduleSheetController = {
  title: string;
  noticeLine: string;
  failedLine: string | null;
  deadline: string;
  canSave: boolean;
  saving: boolean;
  writeDeadline: (typed: string) => void;
  create: () => void;
};
