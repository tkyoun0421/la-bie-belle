import { describe, expect, it } from "vitest";

import { toAttendanceButtonState } from "@/views/home/model/attendance-button";
import type { CountdownState } from "@/views/home/model/countdown";

const OPEN: CountdownState = { phase: "open", remainingSeconds: 300 };
const BEFORE_WINDOW: CountdownState = { phase: "before-window", remainingSeconds: 300 };
const OVERDUE: CountdownState = { phase: "overdue", elapsedSeconds: 120 };

describe("toAttendanceButtonState (F-02, confirmed/home.html:2646-2651)", () => {
  it("온라인이고 인증 창이 열려 있으면 활성 상태로 출근 라벨을 돌려준다", () => {
    expect(toAttendanceButtonState(OPEN, "check-in", true)).toEqual({
      disabled: false,
      label: "출근 인증하기",
    });
  });

  it("온라인이고 인증 창이 열려 있으면 활성 상태로 퇴근 라벨을 돌려준다", () => {
    expect(toAttendanceButtonState(OPEN, "check-out", true)).toEqual({
      disabled: false,
      label: "퇴근 인증하기",
    });
  });

  it("인증 창이 열리기 전이면 온라인이어도 비활성이다", () => {
    expect(toAttendanceButtonState(BEFORE_WINDOW, "check-in", true).disabled).toBe(true);
  });

  it("경과 후(overdue)에도 온라인이면 계속 활성이다", () => {
    expect(toAttendanceButtonState(OVERDUE, "check-in", true).disabled).toBe(false);
  });

  it("오프라인이면 인증 창이 열려 있어도 비활성이고 라벨이 연결 안내로 바뀐다", () => {
    expect(toAttendanceButtonState(OPEN, "check-in", false)).toEqual({
      disabled: true,
      label: "연결되면 인증할 수 있어요",
    });
  });

  it("오프라인이고 인증 창이 열리기 전이어도 라벨은 연결 안내가 우선한다", () => {
    expect(toAttendanceButtonState(BEFORE_WINDOW, "check-in", false)).toEqual({
      disabled: true,
      label: "연결되면 인증할 수 있어요",
    });
  });

  it("오프라인이면 경과 후(overdue)에도 비활성이고 라벨이 연결 안내다", () => {
    expect(toAttendanceButtonState(OVERDUE, "check-out", false)).toEqual({
      disabled: true,
      label: "연결되면 인증할 수 있어요",
    });
  });
});
