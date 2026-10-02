import { COMMUNICATION_DELAY_MINUTES } from "@/entities/attendance/consts/attendance.const";

export type CommunicationTimes = {
  reportedAt: string;
  receivedAt: string;
};

const MINUTE_MS = 60 * 1000;

export function isCommunicationDelayed(times: CommunicationTimes): boolean {
  const gap = Math.abs(
    Date.parse(times.receivedAt) - Date.parse(times.reportedAt),
  );

  return gap > COMMUNICATION_DELAY_MINUTES * MINUTE_MS;
}
