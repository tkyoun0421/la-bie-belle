import { CLOSED_SCHEDULE_WORKER_SHEET } from "@/screens/scheduleWorker/consts/scheduleWorker.const";
export type ScheduleWorkerSheetState =
  { kind: "closed" } | { kind: "open"; openDate: string; cancelling: boolean };

export type ScheduleWorkerSheetAction =
  | { type: "open"; date: string; asCancel: boolean }
  | { type: "ask_cancel" }
  | { type: "close" };

export function scheduleWorkerSheetReducer(
  state: ScheduleWorkerSheetState,
  action: ScheduleWorkerSheetAction,
): ScheduleWorkerSheetState {
  switch (action.type) {
    case "open":
      return {
        kind: "open",
        openDate: action.date,
        cancelling: action.asCancel,
      };
    case "ask_cancel":
      return state.kind === "open" ? { ...state, cancelling: true } : state;
    case "close":
      return CLOSED_SCHEDULE_WORKER_SHEET;
  }
}
