export type CloseDayWarningSheetInput = {
  workDate: string;
  assignmentCount: number;
  onDone: () => void;
};

export type CloseDayWarningSheetController = {
  title: string;
  warningLine: string;
  closing: boolean;
  close: () => void;
};
