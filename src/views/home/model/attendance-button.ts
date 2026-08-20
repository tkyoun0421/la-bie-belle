import type { CountdownState } from "@/views/home/model/countdown";
import type { AttendanceAction } from "@/views/home/model/home-view-model";

export type AttendanceButtonState = {
  disabled: boolean;
  label: string;
};

const ATTENDANCE_LABEL: Record<AttendanceAction, string> = {
  "check-in": "출근 인증하기",
  "check-out": "퇴근 인증하기",
};

const OFFLINE_LABEL = "연결되면 인증할 수 있어요";

export function toAttendanceButtonState(
  countdown: CountdownState,
  action: AttendanceAction,
  online: boolean,
): AttendanceButtonState {
  if (!online) {
    return { disabled: true, label: OFFLINE_LABEL };
  }

  return {
    disabled: countdown.phase === "before-window",
    label: ATTENDANCE_LABEL[action],
  };
}
