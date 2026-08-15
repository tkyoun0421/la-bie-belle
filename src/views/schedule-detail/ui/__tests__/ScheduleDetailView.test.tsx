import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  CONFIRMED_ROSTER_GENERAL,
  CONFIRMED_ROSTER_UNASSIGNED,
  CONFIRMED_ROSTER_WITH_TRAINEE,
} from "@/entities/schedule/model/confirmed-roster.mock";
import {
  buildRosterGroups,
  deriveMyRosterPositions,
} from "@/views/schedule-detail/model/roster-groups";
import { ScheduleDetailView } from "@/views/schedule-detail/ui/ScheduleDetailView";

afterEach(cleanup);

function propsFrom(roster: typeof CONFIRMED_ROSTER_GENERAL, workDate = "2026-08-09") {
  return {
    workDate,
    plannedCheckin: roster.plannedCheckin,
    plannedCheckout: roster.plannedCheckout,
    ceremonyTimes: roster.ceremonyTimes,
    groups: buildRosterGroups(roster.roster),
    myPositions: deriveMyRosterPositions(roster.roster),
  };
}

describe("ScheduleDetailView", () => {
  it("예정 출퇴근·내 배정·전체 배정표·예식 시간을 실제 DOM 순서로 보여준다", () => {
    const { container } = render(<ScheduleDetailView {...propsFrom(CONFIRMED_ROSTER_GENERAL)} />);

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

  it("그날 미배정 근무자는 내 배정 섹션이 없다", () => {
    const { container } = render(
      <ScheduleDetailView {...propsFrom(CONFIRMED_ROSTER_UNASSIGNED)} />,
    );

    const headings = Array.from(container.querySelectorAll("h2")).map((el) => el.textContent);
    expect(headings).toEqual(["전체 배정표", "예식 시간"]);
  });

  it("내 배정 섹션의 포지션은 action 배지로 표시한다", () => {
    render(<ScheduleDetailView {...propsFrom(CONFIRMED_ROSTER_GENERAL)} />);

    const section = screen.getByText("내 배정").closest("section")!;
    const badge = within(section).getByText("매니저");
    expect(badge).toHaveClass("bg-action-surface");
  });

  it("전체 배정표는 기본으로 펼쳐져 있고 본인 행만 강조 배경을 갖는다", () => {
    render(<ScheduleDetailView {...propsFrom(CONFIRMED_ROSTER_GENERAL)} />);

    expect(screen.getByText("김민준")).toBeInTheDocument();
    expect(screen.getByText("이서연")).toBeInTheDocument();

    const myRow = screen.getByText("나").closest("li");
    const otherRow = screen.getByText("김민준").closest("li");
    expect(myRow).toHaveClass("bg-action-surface");
    expect(otherRow).not.toHaveClass("bg-action-surface");
  });

  it("겸직자는 맡은 포지션 그룹마다 등장한다", () => {
    const roster = {
      ...CONFIRMED_ROSTER_GENERAL,
      roster: [
        ...CONFIRMED_ROSTER_GENERAL.roster,
        {
          name: "김민준",
          positionName: "안내",
          sortOrder: 90,
          isTrainee: false,
          isSelf: false,
        },
      ],
    };

    render(<ScheduleDetailView {...propsFrom(roster)} />);

    expect(screen.getAllByText("김민준")).toHaveLength(2);
  });

  it("교육생 행은 교육 배지를 갖는다", () => {
    render(<ScheduleDetailView {...propsFrom(CONFIRMED_ROSTER_WITH_TRAINEE)} />);

    expect(screen.getByText("박도윤").closest("li")).toHaveTextContent("교육");
  });

  it("정식도 교육생도 없는 포지션은 전체 배정표에 나타나지 않는다", () => {
    render(<ScheduleDetailView {...propsFrom(CONFIRMED_ROSTER_GENERAL)} />);

    expect(screen.queryByText("팀장")).toBeNull();
  });

  it("다른 근무자의 전화번호·성별·시급·출결 정보를 노출하지 않는다", () => {
    const { container } = render(<ScheduleDetailView {...propsFrom(CONFIRMED_ROSTER_GENERAL)} />);

    expect(container.textContent).not.toMatch(/\d{3}-\d{4}-\d{4}/);
    expect(container.textContent).not.toContain("원");
  });

  it("필요 인원·미달 여부 숫자를 노출하지 않는다", () => {
    const { container } = render(<ScheduleDetailView {...propsFrom(CONFIRMED_ROSTER_GENERAL)} />);

    expect(container.textContent).not.toMatch(/필요\s*\d/);
    expect(container.textContent).not.toMatch(/배정\s*\d/);
  });

  it("근무 변경 요청 진입점은 비활성 자리표시다", () => {
    render(<ScheduleDetailView {...propsFrom(CONFIRMED_ROSTER_GENERAL)} />);

    expect(screen.getByRole("button", { name: "근무 변경 요청" })).toBeDisabled();
  });

  it("전체 배정표의 각 행에 순차 등장 클래스와 표시 순서대로 stagger-index를 부여한다", () => {
    render(<ScheduleDetailView {...propsFrom(CONFIRMED_ROSTER_GENERAL)} />);

    const rows = ["나", "김민준", "이서연"].map((name) => screen.getByText(name).closest("li")!);

    rows.forEach((row, index) => {
      expect(row).toHaveClass("motion-stagger-item");
      expect(row.getAttribute("style")).toContain(`--stagger-index: ${index}`);
    });
  });
});
