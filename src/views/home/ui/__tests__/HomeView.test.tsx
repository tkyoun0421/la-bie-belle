import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeView } from "@/views/home/ui/HomeView";
import {
  HOME_ATTENDANCE_CHECKING,
  HOME_ATTENDANCE_FAILURE_LOW_ACCURACY,
  HOME_ATTENDANCE_FAILURE_OUT_OF_RANGE,
  HOME_ATTENDANCE_FAILURE_PERMISSION_DENIED,
  HOME_ATTENDANCE_SUCCESS,
  HOME_CHECK_IN_AVAILABLE,
  HOME_CHECK_OUT_AVAILABLE,
  HOME_CONFIRMATION_CHANGE,
  HOME_DEADLINE_APPLICATION,
  HOME_DEADLINE_APPLICATION_APPLIED,
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

  it("GPS 확인 중 상태는 진행 표시와 함께 문구를 보여주고 보조 기술에 전달한다", () => {
    render(<HomeView model={HOME_ATTENDANCE_CHECKING} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("현재 위치를 확인하고 있어요");
    expect(status.querySelector("[aria-hidden]")).not.toBeNull();
  });

  it("GPS 성공 상태는 서버 확인 시각을 보여준다", () => {
    render(<HomeView model={HOME_ATTENDANCE_SUCCESS} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("현장 위치가 확인됐어요");
    expect(status).toHaveTextContent("08:58");
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

  it("마감 임박 신청 상태(미신청)는 신청 유도 문구와 신청 버튼을 보여준다", () => {
    render(<HomeView model={HOME_DEADLINE_APPLICATION} />);
    expect(screen.getByText("근무 신청 마감이 임박했어요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "지금 신청하기" })).toBeInTheDocument();
  });

  it("마감 임박 신청 상태(신청 완료)는 변경 가능 안내를 보여준다", () => {
    render(<HomeView model={HOME_DEADLINE_APPLICATION_APPLIED} />);
    expect(screen.getByText("신청 완료 — 마감 전까지 변경 가능")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "일정에서 확인하기" })).toBeInTheDocument();
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

  it("출퇴근 원본을 수정·삭제하는 UI를 어떤 상태에서도 제공하지 않는다(INV-ATT-01)", () => {
    for (const model of [
      HOME_CHECK_IN_AVAILABLE,
      HOME_CHECK_OUT_AVAILABLE,
      HOME_ATTENDANCE_CHECKING,
      HOME_ATTENDANCE_SUCCESS,
      HOME_ATTENDANCE_FAILURE_PERMISSION_DENIED,
      HOME_ATTENDANCE_FAILURE_LOW_ACCURACY,
      HOME_ATTENDANCE_FAILURE_OUT_OF_RANGE,
    ]) {
      const { unmount } = render(<HomeView model={model} />);
      expect(screen.queryByRole("button", { name: /수정/ })).toBeNull();
      expect(screen.queryByRole("button", { name: /삭제/ })).toBeNull();
      unmount();
    }
  });
});
