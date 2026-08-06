import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "@/shared/ui/button";

afterEach(cleanup);

describe("Button", () => {
  it("기본값은 primary 56px 버튼이다", () => {
    render(<Button>신청하기</Button>);

    const button = screen.getByRole("button", { name: "신청하기" });
    expect(button).toHaveClass("h-14");
    expect(button).toHaveClass("bg-action");
  });

  it("icon variant는 44px 원형이다", () => {
    render(
      <Button variant="icon" aria-label="닫기">
        ×
      </Button>,
    );

    const button = screen.getByRole("button", { name: "닫기" });
    expect(button).toHaveClass("size-11");
    expect(button).toHaveClass("rounded-pill");
  });

  it("destructive variant는 danger 색을 쓴다", () => {
    render(<Button variant="destructive">삭제</Button>);

    expect(screen.getByRole("button", { name: "삭제" })).toHaveClass("bg-danger");
  });

  it("loading이면 라벨을 유지하고 aria-busy와 disabled를 설정한다", () => {
    render(<Button loading>저장</Button>);

    const button = screen.getByRole("button", { name: "저장" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
  });

  it("disabled에 이유가 있으면 aria-describedby로 연결한다", () => {
    render(
      <Button disabled disabledReason="휴대폰 인증이 필요합니다">
        확인
      </Button>,
    );

    const button = screen.getByRole("button", { name: "확인" });
    const describedById = button.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();
    expect(document.getElementById(describedById ?? "")).toHaveTextContent(
      "휴대폰 인증이 필요합니다",
    );
  });

  it("클릭하면 onClick이 호출된다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>확인</Button>);

    await user.click(screen.getByRole("button", { name: "확인" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("asChild면 자식 요소를 그대로 렌더한다", () => {
    render(
      <Button asChild>
        <a href="/next">다음</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "다음" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveClass("bg-action");
  });
});
