import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CheckInRuleEditor } from "@/features/ceremony/ui/CheckInRuleEditor";
import type { SchedulePrepCheckInRule } from "@/entities/schedule/types/schedule-prep";

afterEach(cleanup);

function rules(): SchedulePrepCheckInRule[] {
  return [{ firstCeremonyAt: "10:00", recommendedCheckIn: "08:20" }];
}

function newRuleSection() {
  return screen.getByRole("button", { name: "규칙 추가" }).closest("div")!;
}

describe("CheckInRuleEditor", () => {
  it("규칙이 없으면 새 규칙 입력만 렌더하고 규칙 추가 버튼은 비어있는 값으로 비활성화된다", () => {
    render(
      <CheckInRuleEditor
        rules={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        pending={false}
      />,
    );

    expect(screen.getByLabelText("첫 예식")).toHaveValue("");
    expect(screen.getByLabelText("추천 출근")).toHaveValue("");
    expect(screen.getByRole("button", { name: "규칙 추가" })).toBeDisabled();
  });

  it("기존 규칙 행은 첫 예식이 비활성 표시되고 추천 출근·수정·삭제 버튼을 렌더한다", () => {
    render(
      <CheckInRuleEditor
        rules={rules()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        pending={false}
      />,
    );

    const rowInputs = screen.getAllByLabelText("첫 예식");
    expect(rowInputs[0]).toHaveValue("10:00");
    expect(rowInputs[0]).toBeDisabled();
    expect(screen.getAllByLabelText("추천 출근")[0]).toHaveValue("08:20");
    expect(screen.getAllByRole("button", { name: "수정" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "삭제" })).toHaveLength(1);
  });

  it("추천 출근을 바꾸고 수정을 누르면 onUpdate를 바뀐 값으로 호출한다", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <CheckInRuleEditor
        rules={rules()}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        pending={false}
      />,
    );

    const row = screen.getByRole("button", { name: "수정" }).closest("li")!;
    fireEvent.change(within(row).getByLabelText("추천 출근"), { target: { value: "08:40" } });
    await user.click(within(row).getByRole("button", { name: "수정" }));

    expect(onUpdate).toHaveBeenCalledWith({
      firstCeremonyAt: "10:00",
      recommendedCheckIn: "08:40",
    });
  });

  it("삭제 버튼을 누르면 onDelete를 해당 행의 firstCeremonyAt으로 호출한다", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <CheckInRuleEditor
        rules={rules()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
        pending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(onDelete).toHaveBeenCalledWith({ firstCeremonyAt: "10:00" });
  });

  it("새 규칙 값을 채우고 규칙 추가를 누르면 onCreate를 호출하고 입력을 비운다", async () => {
    const onCreate = vi.fn();
    render(
      <CheckInRuleEditor
        rules={[]}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        pending={false}
      />,
    );

    const section = newRuleSection();
    fireEvent.change(within(section).getByLabelText("첫 예식"), { target: { value: "11:00" } });
    fireEvent.change(within(section).getByLabelText("추천 출근"), { target: { value: "09:00" } });

    const addButton = within(section).getByRole("button", { name: "규칙 추가" });
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);

    expect(onCreate).toHaveBeenCalledWith({
      firstCeremonyAt: "11:00",
      recommendedCheckIn: "09:00",
    });
    expect(within(section).getByLabelText("첫 예식")).toHaveValue("");
    expect(within(section).getByLabelText("추천 출근")).toHaveValue("");
  });

  it("pending이면 수정·삭제·규칙 추가 버튼이 모두 비활성화된다", () => {
    render(
      <CheckInRuleEditor
        rules={rules()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        pending
      />,
    );

    expect(screen.getByRole("button", { name: "수정" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "삭제" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "규칙 추가" })).toBeDisabled();
  });
});
