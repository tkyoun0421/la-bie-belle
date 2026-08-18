import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MaskedAmount } from "@/shared/ui/masked-amount";

afterEach(cleanup);

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

describe("MaskedAmount", () => {
  it("가려진 동안 실제 금액 문자열을 DOM에 넣지 않는다", () => {
    const { container } = render(
      <MaskedAmount
        value={180000}
        masked
        sweep={false}
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    expect(screen.queryByText("180,000원")).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain("180,000");
  });

  it("가려진 동안 더미가 aria-hidden이라 스크린 리더에 안 읽힌다", () => {
    const { container } = render(
      <MaskedAmount
        value={180000}
        masked
        sweep={false}
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    const dummy = container.querySelector('[aria-hidden="true"]');
    expect(dummy).not.toBeNull();
    expect(dummy?.textContent).not.toBe("180,000원");
  });

  it("가려진 더미는 blur 7px로 흐리게 깐다", () => {
    const { container } = render(
      <MaskedAmount
        value={180000}
        masked
        sweep={false}
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    const dummy = container.querySelector('[aria-hidden="true"]');
    expect(dummy).toHaveClass("blur-[7px]");
  });

  it("열린 동안에는 실제 금액이 보이고 aria-hidden이 아니다", () => {
    render(
      <MaskedAmount
        value={180000}
        masked={false}
        sweep={false}
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    const value = screen.getByText("180,000원");
    expect(value).not.toHaveAttribute("aria-hidden");
  });

  it("가려졌든 열렸든 button 역할이라 클릭·포인터 규칙이 둘 다에 닿는다(버그 ④)", () => {
    const { rerender } = render(
      <MaskedAmount
        value={180000}
        masked
        sweep={false}
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "금액 보기" })).toBeInTheDocument();

    rerender(
      <MaskedAmount
        value={180000}
        masked={false}
        sweep={false}
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "금액 가리기" })).toBeInTheDocument();
  });

  it("가려진 금액을 누르면 onToggle을 부른다", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <MaskedAmount
        value={180000}
        masked
        sweep={false}
        format={formatWon}
        onToggle={onToggle}
        onSweepEnd={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "금액 보기" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("열려 있을 때 누르면 onToggle이 불린다", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <MaskedAmount
        value={180000}
        masked={false}
        sweep={false}
        format={formatWon}
        onToggle={onToggle}
        onSweepEnd={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "금액 가리기" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("연타해도 onToggle은 클릭 횟수만큼만 불린다 — 내부에서 중복 상태를 만들지 않는다", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <MaskedAmount
        value={180000}
        masked
        sweep={false}
        format={formatWon}
        onToggle={onToggle}
        onSweepEnd={() => {}}
      />,
    );

    const trigger = screen.getByRole("button", { name: "금액 보기" });
    await user.click(trigger);
    await user.click(trigger);

    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});

describe("MaskedAmount 더미 자릿수 일치 (버그 ③)", () => {
  it("더미는 실제 금액의 숫자만 0으로 치환한 문자열이다 — 132,000원 계열", () => {
    const { container } = render(
      <MaskedAmount
        value={180000}
        masked
        sweep={false}
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    const dummy = container.querySelector('[aria-hidden="true"]');
    expect(dummy?.textContent).toBe("000,000원");
  });

  it("자릿수가 다른 값도 실제 금액과 같은 자릿수로 치환된다 — 2,652,000원 계열", () => {
    const { container } = render(
      <MaskedAmount
        value={2652000}
        masked
        sweep={false}
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    const dummy = container.querySelector('[aria-hidden="true"]');
    expect(dummy?.textContent).toBe("0,000,000원");
  });
});

describe("MaskedAmount 리빌 훑기 (인수 조건 37)", () => {
  it("손으로 열렸을 때(sweep) amount-sweep 클래스가 한 번 걸리고 지속시간을 인라인으로 박지 않는다", () => {
    const { container } = render(
      <MaskedAmount
        value={180000}
        masked={false}
        sweep
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    const sweeping = container.querySelector(".amount-sweep");
    expect(sweeping).not.toBeNull();
    expect(sweeping?.getAttribute("style") ?? "").not.toMatch(/\d+m?s/);
  });

  it("화면 복귀·상태 전환처럼 손이 안 닿은 열림(sweep={false})에서는 훑기 클래스가 없다", () => {
    const { container } = render(
      <MaskedAmount
        value={180000}
        masked={false}
        sweep={false}
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    expect(container.querySelector(".amount-sweep")).toBeNull();
  });

  it("가려져 있으면 sweep이 true여도 훑기 클래스가 없다", () => {
    const { container } = render(
      <MaskedAmount
        value={180000}
        masked
        sweep
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    expect(container.querySelector(".amount-sweep")).toBeNull();
  });

  it("가림이 다시 걸리면 훑기 클래스가 즉시 사라진다", () => {
    const { container, rerender } = render(
      <MaskedAmount
        value={180000}
        masked={false}
        sweep
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    expect(container.querySelector(".amount-sweep")).not.toBeNull();

    rerender(
      <MaskedAmount
        value={180000}
        masked
        sweep
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={() => {}}
      />,
    );

    expect(container.querySelector(".amount-sweep")).toBeNull();
  });

  it("훑기가 끝나면(animationend) onSweepEnd를 부른다", () => {
    const onSweepEnd = vi.fn();
    const { container } = render(
      <MaskedAmount
        value={180000}
        masked={false}
        sweep
        format={formatWon}
        onToggle={() => {}}
        onSweepEnd={onSweepEnd}
      />,
    );

    const sweeping = container.querySelector(".amount-sweep");
    expect(sweeping).not.toBeNull();

    fireEvent.animationEnd(sweeping as Element);

    expect(onSweepEnd).toHaveBeenCalledTimes(1);
  });
});
