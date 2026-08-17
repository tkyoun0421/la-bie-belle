import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BlockBoundary } from "@/shared/ui/block-boundary";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function Thrower(): ReactNode {
  throw new Error("블록 렌더 실패");
}

afterEach(() => {
  cleanup();
  refreshMock.mockClear();
});

describe("BlockBoundary", () => {
  it("정상일 때 children을 그대로 렌더한다", () => {
    render(
      <BlockBoundary name="오늘 출퇴근">
        <p>오늘 근무 09:00~18:00</p>
      </BlockBoundary>,
    );

    expect(screen.getByText("오늘 근무 09:00~18:00")).toBeInTheDocument();
    expect(screen.queryByText(/을 불러오지 못했어요/)).not.toBeInTheDocument();
  });

  describe("자식이 던질 때", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("블록 이름과 다시 시도 버튼을 그 자리에 세운다", () => {
      render(
        <BlockBoundary name="오늘 출퇴근">
          <Thrower />
        </BlockBoundary>,
      );

      expect(screen.getByText(/오늘 출퇴근을 불러오지 못했어요/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    });

    it("다시 시도를 누르면 reset 뒤 router.refresh()를 정확히 한 번 부른다", async () => {
      const user = userEvent.setup();
      render(
        <BlockBoundary name="오늘 출퇴근">
          <Thrower />
        </BlockBoundary>,
      );

      await user.click(screen.getByRole("button", { name: "다시 시도" }));

      expect(refreshMock).toHaveBeenCalledOnce();
    });

    it("연타해도 요청이 겹치지 않는다 — 첫 클릭 뒤 버튼이 잠기고 두 번째 클릭은 무시된다", async () => {
      const user = userEvent.setup();
      render(
        <BlockBoundary name="오늘 출퇴근">
          <Thrower />
        </BlockBoundary>,
      );

      await user.click(screen.getByRole("button", { name: "다시 시도" }));

      const retryButtonAfterFirstClick = screen.getByRole("button", { name: "다시 시도" });
      expect(retryButtonAfterFirstClick).toBeDisabled();

      await user.click(retryButtonAfterFirstClick);

      expect(refreshMock).toHaveBeenCalledOnce();
    });

    it("빨강 계열 클래스를 쓰지 않는다", () => {
      const { container } = render(
        <BlockBoundary name="오늘 출퇴근">
          <Thrower />
        </BlockBoundary>,
      );

      const classNames = Array.from(container.querySelectorAll("*")).flatMap((element) =>
        element.className.toString().split(/\s+/).filter(Boolean),
      );

      expect(classNames.some((className) => /danger|destructive|red/i.test(className))).toBe(false);
    });

    it("형제 BlockBoundary 중 하나가 던져도 나머지 하나는 산다", () => {
      render(
        <>
          <BlockBoundary name="오늘 출퇴근">
            <Thrower />
          </BlockBoundary>
          <BlockBoundary name="이번 주">
            <p>이번 주 근무 3일</p>
          </BlockBoundary>
        </>,
      );

      expect(screen.getByText(/오늘 출퇴근을 불러오지 못했어요/)).toBeInTheDocument();
      expect(screen.getByText("이번 주 근무 3일")).toBeInTheDocument();
    });
  });
});
