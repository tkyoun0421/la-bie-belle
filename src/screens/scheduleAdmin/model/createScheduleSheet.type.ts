export type CreateScheduleSheetInput = {
  month: string;
  failed: boolean;
};

export type CreateScheduleSheetController = {
  title: string;
  noticeLine: string;
  failedLine: string | null;
};
