import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PendingView } from "@/views/pending/ui/PendingView";

afterEach(cleanup);

describe("PendingView", () => {
  it("승인 대기 상태와 문의 안내를 렌더한다", () => {
    render(<PendingView />);

    expect(screen.getByRole("heading")).toHaveTextContent("승인을 기다리고 있어요");
    expect(screen.getByText(/문의/)).toBeInTheDocument();
  });

  it("삭제 기한이 연장된다는 표현을 쓰지 않는다", () => {
    render(<PendingView />);

    expect(screen.queryByText(/연장/)).not.toBeInTheDocument();
  });
});
