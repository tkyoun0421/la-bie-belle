import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CeremonyListEditor } from "@/features/ceremony/ui/CeremonyListEditor";

afterEach(cleanup);

describe("CeremonyListEditor", () => {
  it("예식 시각마다 순번이 붙은 입력과 삭제 버튼을 렌더한다", () => {
    render(
      <CeremonyListEditor
        ceremonyTimes={["10:00", "11:00"]}
        onUpdateTime={vi.fn()}
        onAddTime={vi.fn()}
        onRemoveTime={vi.fn()}
        onSave={vi.fn()}
        saving={false}
      />,
    );

    expect(screen.getByLabelText("예식 1")).toHaveValue("10:00");
    expect(screen.getByLabelText("예식 2")).toHaveValue("11:00");
    expect(screen.getAllByRole("button", { name: "삭제" })).toHaveLength(2);
  });

  it("예식 시각을 바꾸면 onUpdateTime을 해당 인덱스와 값으로 호출한다", () => {
    const onUpdateTime = vi.fn();
    render(
      <CeremonyListEditor
        ceremonyTimes={["10:00", "11:00"]}
        onUpdateTime={onUpdateTime}
        onAddTime={vi.fn()}
        onRemoveTime={vi.fn()}
        onSave={vi.fn()}
        saving={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("예식 2"), { target: { value: "12:30" } });

    expect(onUpdateTime).toHaveBeenCalledWith(1, "12:30");
  });

  it("삭제 버튼을 누르면 onRemoveTime을 해당 인덱스로 호출한다", async () => {
    const user = userEvent.setup();
    const onRemoveTime = vi.fn();
    render(
      <CeremonyListEditor
        ceremonyTimes={["10:00", "11:00"]}
        onUpdateTime={vi.fn()}
        onAddTime={vi.fn()}
        onRemoveTime={onRemoveTime}
        onSave={vi.fn()}
        saving={false}
      />,
    );

    const secondRow = screen.getByLabelText("예식 2").closest("li")!;
    await user.click(within(secondRow).getByRole("button", { name: "삭제" }));

    expect(onRemoveTime).toHaveBeenCalledWith(1);
  });

  it("예식 추가·저장 버튼을 누르면 각각 onAddTime·onSave를 호출한다", async () => {
    const user = userEvent.setup();
    const onAddTime = vi.fn();
    const onSave = vi.fn();
    render(
      <CeremonyListEditor
        ceremonyTimes={["10:00"]}
        onUpdateTime={vi.fn()}
        onAddTime={onAddTime}
        onRemoveTime={vi.fn()}
        onSave={onSave}
        saving={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "예식 추가" }));
    expect(onAddTime).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("saving이면 저장 버튼이 비활성화된다", () => {
    render(
      <CeremonyListEditor
        ceremonyTimes={["10:00"]}
        onUpdateTime={vi.fn()}
        onAddTime={vi.fn()}
        onRemoveTime={vi.fn()}
        onSave={vi.fn()}
        saving
      />,
    );

    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });
});
