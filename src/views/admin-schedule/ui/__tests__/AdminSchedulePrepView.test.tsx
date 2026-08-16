import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminSchedulePrepView } from "@/views/admin-schedule/ui/AdminSchedulePrepView";
import type { SchedulePrep } from "@/entities/schedule/types/schedule-prep";
import type { ScheduleRequirementRow } from "@/entities/schedule/types/schedule-requirement";

afterEach(cleanup);

function schedulePrep(): SchedulePrep {
  return {
    id: "schedule-1",
    workDate: "2099-01-01",
    status: "CANCELLED",
    ceremonyTimes: [],
    plannedCheckin: null,
    plannedCheckout: null,
    checkInRules: [],
  };
}

function confirmedSchedulePrep(): SchedulePrep {
  return {
    id: "schedule-2",
    workDate: "2099-02-02",
    status: "CONFIRMED",
    ceremonyTimes: ["10:00"],
    plannedCheckin: null,
    plannedCheckout: null,
    checkInRules: [],
  };
}

type BaseProps = Parameters<typeof AdminSchedulePrepView>[0];

function baseProps(overrides: Partial<BaseProps>): BaseProps {
  return {
    schedulePrep: schedulePrep(),
    onReplaceCeremonies: vi.fn(),
    onSetPlannedTimes: vi.fn(),
    onCreateCheckInRule: vi.fn(),
    onUpdateCheckInRule: vi.fn(),
    onDeleteCheckInRule: vi.fn(),
    requirementRows: [],
    assignedCounts: {},
    assignedHeadcount: null,
    assignedWorkerCount: 0,
    traineeCounts: {},
    traineePositions: [],
    activePositions: [],
    onSetRequirement: vi.fn(),
    onRemoveRequirement: vi.fn(),
    onListCandidates: vi.fn(),
    onReplaceAssignments: vi.fn(),
    onConfirmSchedule: vi.fn(),
    onCancelSchedule: vi.fn(),
    ...overrides,
  };
}

describe("AdminSchedulePrepView", () => {
  it("취소된 스케줄은 날짜 제목과 취소 안내를 렌더하고 던지지 않는다(P3-T08 스모크)", () => {
    render(
      <AdminSchedulePrepView
        schedulePrep={schedulePrep()}
        onReplaceCeremonies={vi.fn()}
        onSetPlannedTimes={vi.fn()}
        onCreateCheckInRule={vi.fn()}
        onUpdateCheckInRule={vi.fn()}
        onDeleteCheckInRule={vi.fn()}
        requirementRows={[]}
        assignedCounts={{}}
        assignedHeadcount={null}
        assignedWorkerCount={0}
        traineeCounts={{}}
        traineePositions={[]}
        activePositions={[]}
        onSetRequirement={vi.fn()}
        onRemoveRequirement={vi.fn()}
        onListCandidates={vi.fn()}
        onReplaceAssignments={vi.fn()}
        onConfirmSchedule={vi.fn()}
        onCancelSchedule={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "2099-01-01" })).toBeInTheDocument();
    expect(screen.getByText("취소")).toBeInTheDocument();
    expect(
      screen.getByText("취소된 스케줄은 예식·예정 시각을 수정할 수 없어요"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "스케줄 확정" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "스케줄 취소" })).not.toBeInTheDocument();
  });

  it("확정 상태에서도 표 밖 교육생 잔존 포지션의 담당자 없음 경고를 경고 요약 영역에 보여준다(P3-T11 F-01)", () => {
    render(
      <AdminSchedulePrepView
        {...baseProps({
          schedulePrep: confirmedSchedulePrep(),
          requirementRows: [],
          assignedCounts: {},
          traineeCounts: { "position-scan": 1 },
          traineePositions: [{ positionId: "position-scan", positionName: "스캔", sortOrder: 1 }],
        })}
      />,
    );

    const summary = screen.getByTestId("confirmation-warning-summary");
    expect(within(summary).getByText("스캔 · 교육 1")).toBeInTheDocument();
  });

  it("필요 인원 미달·담당자 없음이 둘 다 없으면 경고 요약 영역을 그리지 않는다(P3-T11 F-01)", () => {
    render(
      <AdminSchedulePrepView
        {...baseProps({
          schedulePrep: confirmedSchedulePrep(),
          requirementRows: [],
          assignedCounts: {},
          traineeCounts: {},
          traineePositions: [],
        })}
      />,
    );

    expect(screen.queryByTestId("confirmation-warning-summary")).not.toBeInTheDocument();
  });

  it("표 안 담당자 없음 경고와 표 밖 담당자 없음 경고를 경고 요약 영역에 동시에 보여준다(P3-T11 F-01)", () => {
    const requirementRows: ScheduleRequirementRow[] = [
      { positionId: "position-floor", positionName: "플로어", requiredCount: 1 },
    ];

    render(
      <AdminSchedulePrepView
        {...baseProps({
          schedulePrep: confirmedSchedulePrep(),
          requirementRows,
          assignedCounts: {},
          traineeCounts: { "position-floor": 1, "position-scan": 1 },
          traineePositions: [{ positionId: "position-scan", positionName: "스캔", sortOrder: 1 }],
        })}
      />,
    );

    const summary = screen.getByTestId("confirmation-warning-summary");
    expect(within(summary).getByText("플로어 · 교육 1")).toBeInTheDocument();
    expect(within(summary).getByText("스캔 · 교육 1")).toBeInTheDocument();
  });
});
