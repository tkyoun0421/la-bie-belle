export type RecruitmentStatus = "open" | "closed";

export type WorkSchedule = {
  date: string;
  status: RecruitmentStatus;
  applicationDeadline: string;
};
