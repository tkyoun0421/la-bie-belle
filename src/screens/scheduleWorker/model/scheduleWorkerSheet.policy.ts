import { CLOSED_SCHEDULE_WORKER_SHEET } from "@/screens/scheduleWorker/consts/scheduleWorker.const";
import {
  scheduleWorkerSheetReducer,
  type ScheduleWorkerSheetState,
} from "@/screens/scheduleWorker/model/scheduleWorkerSheet.reducer";

export function sheetOpenedOn(
  date: string | undefined,
): ScheduleWorkerSheetState {
  return date === undefined
    ? CLOSED_SCHEDULE_WORKER_SHEET
    : scheduleWorkerSheetReducer(CLOSED_SCHEDULE_WORKER_SHEET, {
        type: "open",
        date,
        asCancel: false,
      });
}
