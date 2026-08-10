import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  CONFIRMED_WITH_CHANGE,
  GENERAL_CONFIRMATION,
  TRAINEE_CONFIRMATION,
} from "@/entities/schedule/model/confirmation.mock";
import { ScheduleDetailView } from "@/views/schedule-detail/ui/ScheduleDetailView";

afterEach(cleanup);

describe("ScheduleDetailView", () => {
  it("예정 출퇴근·내 배정·전체 배정표·예식 시간을 실제 DOM 순서로 보여준다", () => {
    const { container } = render(<ScheduleDetailView confirmation={GENERAL_CONFIRMATION} />);

    const headings = Array.from(container.querySelectorAll("h2")).map((el) => el.textContent);
    expect(headings).toEqual(["내 배정", "전체 배정표", "예식 시간"]);

    const mainText = container.querySelector("main")!.textContent!;
    const scheduledTimeIndex = mainText.indexOf("09:00 - 18:00");
    const myAssignmentIndex = mainText.indexOf("내 배정");
    const rosterIndex = mainText.indexOf("전체 배정표");
    const ceremonyIndex = mainText.indexOf("예식 시간");

    expect(scheduledTimeIndex).toBeGreaterThanOrEqual(0);
    expect(scheduledTimeIndex).toBeLessThan(myAssignmentIndex);
    expect(myAssignmentIndex).toBeLessThan(rosterIndex);
    expect(rosterIndex).toBeLessThan(ceremonyIndex);
  });

  it("변경이 있으면 변경 요약을 먼저 보여준다", () => {
    render(<ScheduleDetailView confirmation={CONFIRMED_WITH_CHANGE} />);

    expect(screen.getByText("시작 시간이 30분 당겨졌어요")).toBeInTheDocument();
  });

  it("변경이 없으면 변경 요약을 보여주지 않는다", () => {
    render(<ScheduleDetailView confirmation={GENERAL_CONFIRMATION} />);

    expect(screen.queryByText(/당겨졌어요|늦춰졌어요/)).toBeNull();
  });

  it("전체 배정표는 기본으로 펼쳐져 있고 본인 행만 강조 배경을 갖는다", () => {
    render(<ScheduleDetailView confirmation={GENERAL_CONFIRMATION} />);

    expect(screen.getByText("김민준")).toBeInTheDocument();
    expect(screen.getByText("이서연")).toBeInTheDocument();

    const myRow = screen.getByText("나").closest("li");
    const otherRow = screen.getByText("김민준").closest("li");
    expect(myRow).toHaveClass("bg-action-surface");
    expect(otherRow).not.toHaveClass("bg-action-surface");
  });

  it("교육생 행은 교육 배지를 갖는다", () => {
    render(<ScheduleDetailView confirmation={TRAINEE_CONFIRMATION} />);

    expect(screen.getByText("박도윤").closest("li")).toHaveTextContent("교육");
  });

  it("정식 담당자의 포지션은 action 배지로 표시한다", () => {
    render(<ScheduleDetailView confirmation={GENERAL_CONFIRMATION} />);

    const otherRow = screen.getByText("김민준").closest("li")!;
    const badge = within(otherRow).getByText("플로어");
    expect(badge).toHaveClass("bg-action-surface");
  });

  it("다른 근무자의 전화번호·성별·시급·출결 정보를 노출하지 않는다", () => {
    const { container } = render(<ScheduleDetailView confirmation={GENERAL_CONFIRMATION} />);

    expect(container.textContent).not.toMatch(/\d{3}-\d{4}-\d{4}/);
    expect(container.textContent).not.toContain("원");
  });

  it("근무 변경 요청 진입점은 비활성 자리표시다", () => {
    render(<ScheduleDetailView confirmation={GENERAL_CONFIRMATION} />);

    expect(screen.getByRole("button", { name: "근무 변경 요청" })).toBeDisabled();
  });

  it("전체 배정표의 각 행에 순차 등장 클래스와 표시 순서대로 stagger-index를 부여한다", () => {
    render(<ScheduleDetailView confirmation={GENERAL_CONFIRMATION} />);

    const rows = ["나", "김민준", "이서연"].map((name) => screen.getByText(name).closest("li")!);

    rows.forEach((row, index) => {
      expect(row).toHaveClass("motion-stagger-item");
      expect(row.getAttribute("style")).toContain(`--stagger-index: ${index}`);
    });
  });
});
