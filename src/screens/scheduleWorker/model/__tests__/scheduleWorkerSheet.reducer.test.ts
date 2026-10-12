import { CLOSED_SCHEDULE_WORKER_SHEET } from "@/screens/scheduleWorker/consts/scheduleWorker.const";
import {
  scheduleWorkerSheetReducer,
  type ScheduleWorkerSheetState,
} from "@/screens/scheduleWorker/model/scheduleWorkerSheet.reducer";

const OPEN: ScheduleWorkerSheetState = {
  kind: "open",
  openDate: "2026-10-12",
  cancelling: false,
};

describe("scheduleWorkerSheetReducer — 초기 상태", () => {
  it("시트가 닫혀 있고 취소 중이라는 값은 없다", () => {
    expect(CLOSED_SCHEDULE_WORKER_SHEET).toEqual({ kind: "closed" });
  });
});

describe("scheduleWorkerSheetReducer — 시트를 연다", () => {
  it("날을 눌러 열면 그 날이 서고 취소 중이 아니다", () => {
    const next = scheduleWorkerSheetReducer(CLOSED_SCHEDULE_WORKER_SHEET, {
      type: "open",
      date: "2026-10-12",
      asCancel: false,
    });

    expect(next).toEqual({
      kind: "open",
      openDate: "2026-10-12",
      cancelling: false,
    });
  });

  it("취소를 물으며 열면 cancelling이 켜진다", () => {
    const next = scheduleWorkerSheetReducer(CLOSED_SCHEDULE_WORKER_SHEET, {
      type: "open",
      date: "2026-10-13",
      asCancel: true,
    });

    expect(next).toEqual({
      kind: "open",
      openDate: "2026-10-13",
      cancelling: true,
    });
  });

  it("열린 채 다른 날을 열면 날과 취소 여부가 새 값으로 바뀐다", () => {
    const state: ScheduleWorkerSheetState = {
      kind: "open",
      openDate: "2026-10-12",
      cancelling: true,
    };

    const next = scheduleWorkerSheetReducer(state, {
      type: "open",
      date: "2026-10-14",
      asCancel: false,
    });

    expect(next).toEqual({
      kind: "open",
      openDate: "2026-10-14",
      cancelling: false,
    });
  });
});

describe("scheduleWorkerSheetReducer — 취소를 묻는다", () => {
  it("열린 시트에서 취소를 물으면 날은 그대로고 cancelling만 켜진다", () => {
    const next = scheduleWorkerSheetReducer(OPEN, { type: "ask_cancel" });

    expect(next).toEqual({
      kind: "open",
      openDate: "2026-10-12",
      cancelling: true,
    });
  });

  it("닫힌 시트에서 취소를 물어도 닫힌 채다", () => {
    const next = scheduleWorkerSheetReducer(CLOSED_SCHEDULE_WORKER_SHEET, {
      type: "ask_cancel",
    });

    expect(next).toEqual({ kind: "closed" });
  });
});

describe("scheduleWorkerSheetReducer — 시트를 닫으면 취소 중이 남지 않는다", () => {
  it("취소 중이던 시트를 닫으면 closed 하나만 남는다", () => {
    const state: ScheduleWorkerSheetState = {
      kind: "open",
      openDate: "2026-10-12",
      cancelling: true,
    };

    const next = scheduleWorkerSheetReducer(state, { type: "close" });

    expect(next).toEqual({ kind: "closed" });
  });

  it("이미 닫힌 상태에서 닫아도 closed다", () => {
    const next = scheduleWorkerSheetReducer(CLOSED_SCHEDULE_WORKER_SHEET, {
      type: "close",
    });

    expect(next).toEqual({ kind: "closed" });
  });
});
