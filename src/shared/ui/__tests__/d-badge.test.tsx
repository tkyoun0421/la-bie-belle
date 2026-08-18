import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DBadge } from "@/shared/ui/d-badge";

afterEach(cleanup);

describe("DBadge", () => {
  it("라벨 텍스트를 그대로 보여준다", () => {
    render(<DBadge label="D-1" tier="d1" />);

    expect(screen.getByText("D-1")).toBeInTheDocument();
  });

  it("없음도 라벨로 그대로 표시할 수 있다", () => {
    render(<DBadge label="없음" tier="neutral" />);

    expect(screen.getByText("없음")).toBeInTheDocument();
  });

  it("32×32 칸에 rounded-cell을 쓴다 — 11px와 12px를 하나로 합친 토큰(revision 7)", () => {
    render(<DBadge label="D-1" tier="d1" />);
    const badge = screen.getByText("D-1");

    expect(badge).toHaveClass("size-8");
    expect(badge).toHaveClass("rounded-cell");
  });

  it("임의값 radius를 쓰지 않는다", () => {
    render(<DBadge label="D-1" tier="d1" />);

    expect(screen.getByText("D-1").className).not.toMatch(/rounded-\[/);
  });

  it("D-1은 진한 파랑 틴트다 — action-tint-strong + action-deep", () => {
    render(<DBadge label="D-1" tier="d1" />);
    const badge = screen.getByText("D-1");

    expect(badge).toHaveClass("bg-action-tint-strong");
    expect(badge).toHaveClass("text-action-deep");
  });

  it("D-2는 옅은 파랑 틴트다 — action-tint + action-deep", () => {
    render(<DBadge label="D-2" tier="d2" />);
    const badge = screen.getByText("D-2");

    expect(badge).toHaveClass("bg-action-tint");
    expect(badge).toHaveClass("text-action-deep");
  });

  it("D-3 이상·없음은 회색이다 — surface-weak + text", () => {
    render(<DBadge label="D-4" tier="neutral" />);
    const badge = screen.getByText("D-4");

    expect(badge).toHaveClass("bg-surface-weak");
    expect(badge).toHaveClass("text-text");
  });

  it("어느 층위도 가장 강한 파랑(action)은 쓰지 않는다 — 그 파랑은 지금 눌러야 할 버튼 하나의 것이다", () => {
    render(<DBadge label="D-1" tier="d1" />);
    const badge = screen.getByText("D-1");

    expect(badge).not.toHaveClass("bg-action");
    expect(badge).not.toHaveClass("text-action");
  });

  it("숫자 자리가 흔들리지 않도록 tabular-nums를 쓴다", () => {
    render(<DBadge label="D-1" tier="d1" />);

    expect(screen.getByText("D-1")).toHaveClass("tabular-nums");
  });

  it("글자는 caption-strong(13/18)에 600 굵기를 얹는다(라운드 24 override)", () => {
    render(<DBadge label="D-1" tier="d1" />);
    const badge = screen.getByText("D-1");

    expect(badge).toHaveClass("typo-caption-strong");
    expect(badge).toHaveClass("font-semibold");
  });

  it("읽기 전용 표시라 상호작용 role을 갖지 않는다", () => {
    render(<DBadge label="D-1" tier="d1" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
