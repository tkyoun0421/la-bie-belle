import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DormantView } from "@/views/dormant/ui/DormantView";

afterEach(cleanup);

describe("DormantView", () => {
  it("휴면 안내와 자동 탈퇴 예정일을 KST 기준으로 렌더한다", () => {
    render(<DormantView inactivityAnchorAt="2026-01-15T00:00:00+09:00" onReactivate={vi.fn()} />);

    expect(screen.getByRole("heading")).toHaveTextContent("휴면 상태예요");
    expect(screen.getByText(/2027년 1월 15일/)).toBeInTheDocument();
  });

  it("다시 활동하기 버튼을 렌더한다", () => {
    render(<DormantView inactivityAnchorAt="2026-01-15T00:00:00+09:00" onReactivate={vi.fn()} />);

    expect(screen.getByRole("button", { name: "다시 활동하기" })).toBeInTheDocument();
  });

  it("문의 문구를 렌더한다", () => {
    render(<DormantView inactivityAnchorAt="2026-01-15T00:00:00+09:00" onReactivate={vi.fn()} />);

    expect(screen.getByText(/문의/)).toBeInTheDocument();
  });
});
