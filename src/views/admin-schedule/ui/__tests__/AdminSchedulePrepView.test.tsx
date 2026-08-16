import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminSchedulePrepView } from "@/views/admin-schedule/ui/AdminSchedulePrepView";
import type { SchedulePrep } from "@/entities/schedule/types/schedule-prep";

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
});
