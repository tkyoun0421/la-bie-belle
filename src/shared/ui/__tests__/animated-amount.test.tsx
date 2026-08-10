import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AnimatedAmount } from "@/shared/ui/animated-amount";
import { MotionProvider } from "@/shared/ui/motion-provider";

afterEach(cleanup);

function format(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function renderAmount(value: number, animate: boolean) {
  return render(
    <MotionProvider>
      <AnimatedAmount value={value} animate={animate} format={format} />
    </MotionProvider>,
  );
}

describe("AnimatedAmount", () => {
  it("animate=false면 즉시 목표 값을 표시한다", async () => {
    renderAmount(50000, false);

    await waitFor(() => expect(screen.getByText("50,000원")).toBeInTheDocument());
  });

  it("animate=true면 값 변경 후 최종적으로 목표 값에 도달한다", async () => {
    const { rerender } = renderAmount(0, false);
    await waitFor(() => expect(screen.getByText("0원")).toBeInTheDocument());

    rerender(
      <MotionProvider>
        <AnimatedAmount value={120000} animate format={format} />
      </MotionProvider>,
    );

    await waitFor(() => expect(screen.getByText("120,000원")).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it("값이 줄어드는 전환도 최종 값에 도달한다", async () => {
    const { rerender } = renderAmount(100000, false);
    await waitFor(() => expect(screen.getByText("100,000원")).toBeInTheDocument());

    rerender(
      <MotionProvider>
        <AnimatedAmount value={30000} animate format={format} />
      </MotionProvider>,
    );

    await waitFor(() => expect(screen.getByText("30,000원")).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it("0원에서 시작하는 전환도 최종 값에 도달한다", async () => {
    const { rerender } = renderAmount(0, false);
    await waitFor(() => expect(screen.getByText("0원")).toBeInTheDocument());

    rerender(
      <MotionProvider>
        <AnimatedAmount value={5000} animate format={format} />
      </MotionProvider>,
    );

    await waitFor(() => expect(screen.getByText("5,000원")).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it("연속 편집에서 이전 보간이 취소되고 마지막 값에 도달한다", async () => {
    const { rerender } = renderAmount(0, false);
    await waitFor(() => expect(screen.getByText("0원")).toBeInTheDocument());

    rerender(
      <MotionProvider>
        <AnimatedAmount value={10000} animate format={format} />
      </MotionProvider>,
    );
    rerender(
      <MotionProvider>
        <AnimatedAmount value={99000} animate format={format} />
      </MotionProvider>,
    );

    await waitFor(() => expect(screen.getByText("99,000원")).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it("언마운트돼도 오류를 던지지 않는다", async () => {
    const { rerender, unmount } = renderAmount(0, false);
    await waitFor(() => expect(screen.getByText("0원")).toBeInTheDocument());

    rerender(
      <MotionProvider>
        <AnimatedAmount value={50000} animate format={format} />
      </MotionProvider>,
    );

    expect(() => unmount()).not.toThrow();
  });
});
