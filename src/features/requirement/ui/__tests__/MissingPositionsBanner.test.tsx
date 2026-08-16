import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MissingPositionsBanner } from "@/features/requirement/ui/MissingPositionsBanner";
import type { Position } from "@/entities/position/model/position";

afterEach(cleanup);

function position(overrides: Partial<Position> = {}): Position {
  return {
    id: "position-1",
    name: "매니저",
    code: null,
    defaultRequiredCount: 1,
    genderRequirement: "any",
    isDefault: false,
    isActive: true,
    ...overrides,
  };
}

describe("MissingPositionsBanner", () => {
  it("missing이 비어 있으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(
      <MissingPositionsBanner missing={[]} onAdd={vi.fn()} pending={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("표에 없는 포지션 목록과 개수를 렌더한다", () => {
    render(
      <MissingPositionsBanner
        missing={[position({ id: "p1", name: "매니저" }), position({ id: "p2", name: "스캔" })]}
        onAdd={vi.fn()}
        pending={false}
      />,
    );

    expect(screen.getByText("표에 없는 포지션 2개")).toBeInTheDocument();
    expect(screen.getByText("매니저")).toBeInTheDocument();
    expect(screen.getByText("스캔")).toBeInTheDocument();
  });

  it("추가 버튼을 누르면 onAdd를 해당 포지션 id로 호출한다", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <MissingPositionsBanner
        missing={[position({ id: "p1", name: "매니저" })]}
        onAdd={onAdd}
        pending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(onAdd).toHaveBeenCalledWith("p1");
  });

  it("pending이면 추가 버튼이 비활성화된다", () => {
    render(
      <MissingPositionsBanner
        missing={[position({ id: "p1", name: "매니저" })]}
        onAdd={vi.fn()}
        pending
      />,
    );

    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();
  });
});
