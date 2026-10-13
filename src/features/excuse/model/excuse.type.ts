export type SubmitExcuseParams = {
  dayId: string;
  body: string;
};

export type DecideExcuseParams = {
  excuseId: string;
  approved: boolean;
  reason: string | null;
};
