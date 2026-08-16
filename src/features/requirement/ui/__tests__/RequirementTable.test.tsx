import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RequirementTable } from "@/features/requirement/ui/RequirementTable";
import type { ScheduleRequirementRow } from "@/entities/schedule/types/schedule-requirement";

afterEach(cleanup);

function rows(): ScheduleRequirementRow[] {
  return [
    { positionId: "p1", positionName: "매니저", requiredCount: 2 },
    { positionId: "p2", positionName: "축가", requiredCount: 1 },
  ];
}

describe("RequirementTable", () => {
  it("행마다 포지션명 라벨의 인원 입력과 저장·삭제 버튼을 렌더한다", () => {
    render(
      <RequirementTable
        rows={rows()}
        onUpdateCount={vi.fn()}
        onSaveCount={vi.fn()}
        onRemoveRow={vi.fn()}
        pending={false}
      />,
    );

    expect(screen.getByLabelText("매니저")).toHaveValue(2);
    expect(screen.getByLabelText("축가")).toHaveValue(1);
    expect(screen.getAllByRole("button", { name: "인원 저장" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "인원 삭제" })).toHaveLength(2);
  });

  it("인원 입력값을 바꾸면 onUpdateCount를 해당 포지션 id와 값으로 호출한다", () => {
    const onUpdateCount = vi.fn();
    render(
      <RequirementTable
        rows={rows()}
        onUpdateCount={onUpdateCount}
        onSaveCount={vi.fn()}
        onRemoveRow={vi.fn()}
        pending={false}
      />,
    );

    const managerInput = screen.getByLabelText("매니저");
    fireEvent.change(managerInput, { target: { value: "3" } });

    expect(onUpdateCount).toHaveBeenCalledWith("p1", 3);
  });

  it("인원 저장 버튼을 누르면 onSaveCount를 해당 행의 포지션 id로 호출한다", async () => {
    const user = userEvent.setup();
    const onSaveCount = vi.fn();
    render(
      <RequirementTable
        rows={rows()}
        onUpdateCount={vi.fn()}
        onSaveCount={onSaveCount}
        onRemoveRow={vi.fn()}
        pending={false}
      />,
    );

    const songRow = screen.getByText("축가").closest("li")!;
    await user.click(within(songRow).getByRole("button", { name: "인원 저장" }));

    expect(onSaveCount).toHaveBeenCalledWith("p2");
  });

  it("인원 삭제 버튼을 누르면 onRemoveRow를 해당 행의 포지션 id로 호출한다", async () => {
    const user = userEvent.setup();
    const onRemoveRow = vi.fn();
    render(
      <RequirementTable
        rows={rows()}
        onUpdateCount={vi.fn()}
        onSaveCount={vi.fn()}
        onRemoveRow={onRemoveRow}
        pending={false}
      />,
    );

    const managerRow = screen.getByText("매니저").closest("li")!;
    await user.click(within(managerRow).getByRole("button", { name: "인원 삭제" }));

    expect(onRemoveRow).toHaveBeenCalledWith("p1");
  });

  it("pending이면 저장·삭제 버튼이 모두 비활성화된다", () => {
    render(
      <RequirementTable
        rows={rows()}
        onUpdateCount={vi.fn()}
        onSaveCount={vi.fn()}
        onRemoveRow={vi.fn()}
        pending
      />,
    );

    for (const button of screen.getAllByRole("button", { name: "인원 저장" })) {
      expect(button).toBeDisabled();
    }
    for (const button of screen.getAllByRole("button", { name: "인원 삭제" })) {
      expect(button).toBeDisabled();
    }
  });
});
