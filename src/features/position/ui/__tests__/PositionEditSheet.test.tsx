import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Position } from "@/entities/position/model/position";
import { PositionEditSheet } from "@/features/position/ui/PositionEditSheet";
import type { PositionFormValues } from "@/features/position/hooks/usePositionEditor";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const SYSTEM_POSITION: Position = {
  id: "position-team-lead",
  name: "팀장",
  code: "team_lead",
  defaultRequiredCount: 1,
  genderRequirement: "any",
  isDefault: false,
  isActive: true,
};

const FORM: PositionFormValues = {
  name: "팀장",
  defaultRequiredCount: 1,
  genderRequirement: "any",
  isDefault: false,
  isActive: true,
};

describe("PositionEditSheet", () => {
  it("F-02: 시스템 포지션도 이름 입력이 열려 있고 수정하면 onUpdateField(name)이 호출된다", () => {
    const onUpdateField = vi.fn();
    render(
      <PositionEditSheet
        editing={SYSTEM_POSITION}
        form={FORM}
        pending={false}
        onClose={vi.fn()}
        onUpdateField={onUpdateField}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const nameInput = screen.getByLabelText("이름");
    expect(nameInput).toBeEnabled();

    fireEvent.change(nameInput, { target: { value: "팀장(수정)" } });

    expect(onUpdateField).toHaveBeenCalledWith("name", "팀장(수정)");
  });

  it("F-02: 시스템 포지션은 삭제·비활성화 컨트롤은 여전히 막혀 있다", () => {
    render(
      <PositionEditSheet
        editing={SYSTEM_POSITION}
        form={FORM}
        pending={false}
        onClose={vi.fn()}
        onUpdateField={vi.fn()}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "삭제" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "활성" })).toBeDisabled();
  });

  it("일반 포지션은 이름 입력이 열려 있고 삭제·비활성화 컨트롤도 열려 있다", () => {
    const normalPosition: Position = { ...SYSTEM_POSITION, id: "position-scan", code: null };
    render(
      <PositionEditSheet
        editing={normalPosition}
        form={FORM}
        pending={false}
        onClose={vi.fn()}
        onUpdateField={vi.fn()}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("이름")).toBeEnabled();
    expect(screen.getByRole("button", { name: "삭제" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "활성" })).toBeEnabled();
  });
});
