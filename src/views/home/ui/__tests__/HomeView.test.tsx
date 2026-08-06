import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeView } from "@/views/home/ui/HomeView";
import {
  HOME_ATTENDANCE_CHECKING,
  HOME_ATTENDANCE_FAILURE_LOW_ACCURACY,
  HOME_ATTENDANCE_FAILURE_OUT_OF_RANGE,
  HOME_ATTENDANCE_FAILURE_PERMISSION_DENIED,
  HOME_CHECK_IN_AVAILABLE,
  HOME_CHECK_OUT_AVAILABLE,
  HOME_CONFIRMATION_CHANGE,
  HOME_DEADLINE_APPLICATION,
  HOME_EMPTY,
  HOME_NEXT_SHIFT,
} from "@/views/home/ui/home.mock";

afterEach(cleanup);

describe("HomeView", () => {
  it("출근 가능 상태는 출근 인증하기 행동을 보여준다", () => {
    render(<HomeView model={HOME_CHECK_IN_AVAILABLE} />);
    expect(screen.getByRole("button", { name: "출근 인증하기" })).toBeInTheDocument();
  });

  it("퇴근 가능 상태는 퇴근 인증하기 행동을 보여준다", () => {
    render(<HomeView model={HOME_CHECK_OUT_AVAILABLE} />);
    expect(screen.getByRole("button", { name: "퇴근 인증하기" })).toBeInTheDocument();
  });

  it("GPS 확인 중 상태를 보여준다", () => {
    render(<HomeView model={HOME_ATTENDANCE_CHECKING} />);
    expect(screen.getByText("현재 위치를 확인하고 있어요")).toBeInTheDocument();
  });

  it("GPS 실패(권한 꺼짐) 상태를 보여준다", () => {
    render(<HomeView model={HOME_ATTENDANCE_FAILURE_PERMISSION_DENIED} />);
    expect(screen.getByText("위치 권한이 꺼져 있어요")).toBeInTheDocument();
  });

  it("GPS 실패(정확도 낮음) 상태를 보여준다", () => {
    render(<HomeView model={HOME_ATTENDANCE_FAILURE_LOW_ACCURACY} />);
    expect(screen.getByText("위치 정확도가 낮아요")).toBeInTheDocument();
  });

  it("GPS 실패(범위 밖) 상태를 보여준다", () => {
    render(<HomeView model={HOME_ATTENDANCE_FAILURE_OUT_OF_RANGE} />);
    expect(screen.getByText("근무지 범위 밖이에요")).toBeInTheDocument();
  });

  it("마감 임박 신청 상태를 보여준다", () => {
    render(<HomeView model={HOME_DEADLINE_APPLICATION} />);
    expect(screen.getByText("근무 신청 마감이 임박했어요")).toBeInTheDocument();
  });

  it("확정 스케줄 변경 확인 상태는 변경 요약을 보여준다", () => {
    render(<HomeView model={HOME_CONFIRMATION_CHANGE} />);
    expect(screen.getByText("시작 시간이 30분 당겨졌어요")).toBeInTheDocument();
  });

  it("다음 근무 상태를 보여준다", () => {
    render(<HomeView model={HOME_NEXT_SHIFT} />);
    expect(screen.getByText("다음 근무")).toBeInTheDocument();
  });

  it("빈 상태를 보여준다", () => {
    render(<HomeView model={HOME_EMPTY} />);
    expect(screen.getByText("아직 할 일이 없어요")).toBeInTheDocument();
  });

  it("홈에는 예상 급여 금액을 표시하지 않는다", () => {
    render(<HomeView model={HOME_NEXT_SHIFT} />);
    expect(screen.queryByText(/원$/)).toBeNull();
  });
});
