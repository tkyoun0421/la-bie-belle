import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Badge } from "@/shared/ui/badge";

afterEach(cleanup);

describe("Badge", () => {
  it("자식 텍스트를 그대로 표시한다", () => {
    render(<Badge>신청</Badge>);

    expect(screen.getByText("신청")).toBeInTheDocument();
  });

  it("기본 tone은 neutral이다", () => {
    render(<Badge>취소됨</Badge>);

    expect(screen.getByText("취소됨")).toHaveClass("bg-neutral-surface");
  });

  it("danger tone은 오류 색을 쓴다", () => {
    render(<Badge tone="danger">만료</Badge>);

    expect(screen.getByText("만료")).toHaveClass("bg-danger-surface");
  });

  it("읽기 전용이라 상호작용 role을 갖지 않는다", () => {
    render(<Badge>확정</Badge>);

    expect(screen.getByText("확정").tagName).toBe("SPAN");
  });
});
