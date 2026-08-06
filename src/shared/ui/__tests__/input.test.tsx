import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Input } from "@/shared/ui/input";

afterEach(cleanup);

describe("Input", () => {
  it("라벨과 입력을 프로그램적으로 연결한다", () => {
    render(<Input label="휴대폰 번호" />);

    const input = screen.getByLabelText("휴대폰 번호");
    expect(input).toHaveClass("h-13");
  });

  it("오류가 있으면 aria-invalid와 aria-describedby로 연결한다", () => {
    render(<Input label="이메일" error="올바른 이메일을 입력하세요" />);

    const input = screen.getByLabelText("이메일");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const describedById = input.getAttribute("aria-describedby");
    expect(document.getElementById(describedById ?? "")).toHaveTextContent(
      "올바른 이메일을 입력하세요",
    );
  });

  it("도움말 텍스트를 aria-describedby로 연결하고 AA 대비를 만족하는 색을 쓴다", () => {
    render(<Input label="시급" helperText="세전 금액을 입력하세요" />);

    const input = screen.getByLabelText("시급");
    const describedById = input.getAttribute("aria-describedby");
    const description = document.getElementById(describedById ?? "");
    expect(description).toHaveTextContent("세전 금액을 입력하세요");
    expect(description).toHaveClass("text-text");
    expect(description).not.toHaveClass("text-text-muted");
  });

  it("비활성 필드는 값과 비활성 이유를 함께 읽을 수 있다", () => {
    render(
      <Input
        label="근무지"
        defaultValue="본점"
        disabled
        disabledReason="배정 후에는 바꿀 수 없어요"
      />,
    );

    const input = screen.getByLabelText("근무지");
    expect(input).toBeDisabled();
    expect(input).toHaveValue("본점");
    const describedById = input.getAttribute("aria-describedby");
    expect(document.getElementById(describedById ?? "")).toHaveTextContent(
      "배정 후에는 바꿀 수 없어요",
    );
  });
});
