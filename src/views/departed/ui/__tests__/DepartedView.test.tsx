import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DepartedView } from "@/views/departed/ui/DepartedView";

afterEach(cleanup);

describe("DepartedView", () => {
  it("탈퇴 안내와 문의 문구를 렌더한다", () => {
    render(<DepartedView />);

    expect(screen.getByRole("heading")).toHaveTextContent("탈퇴 처리된 계정이에요");
    expect(screen.getByText(/문의/)).toBeInTheDocument();
  });

  it("재활성화나 다른 행동을 유도하는 버튼이 없다", () => {
    render(<DepartedView />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
