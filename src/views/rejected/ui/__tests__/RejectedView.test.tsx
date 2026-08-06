import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RejectedView } from "@/views/rejected/ui/RejectedView";

afterEach(cleanup);

describe("RejectedView", () => {
  it("거절 안내와 정적 문의 문구를 렌더한다", () => {
    render(<RejectedView />);

    expect(screen.getByRole("heading")).toBeInTheDocument();
    expect(screen.getByText("급한 문의는 운영 담당자에게 직접 연락해 주세요")).toBeInTheDocument();
  });

  it("거절 사유를 렌더하지 않는다", () => {
    render(<RejectedView />);

    expect(screen.queryByText(/사유/)).not.toBeInTheDocument();
  });
});
