import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OfflineBanner } from "@/widgets/offline/ui/OfflineBanner";

function setNavigatorOnLine(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

afterEach(cleanup);

describe("OfflineBanner — standalone (자기 레이아웃이 셸을 안 두른 화면)", () => {
  it("온라인이면 아무것도 표시하지 않는다", () => {
    setNavigatorOnLine(true);
    render(<OfflineBanner />);
    expect(screen.queryByText("인터넷 연결이 끊겼어요")).not.toBeInTheDocument();
  });

  it("오프라인이면 배너 문구를 표시한다", () => {
    setNavigatorOnLine(false);
    render(<OfflineBanner />);
    expect(screen.getByText("인터넷 연결이 끊겼어요")).toBeInTheDocument();
  });

  it("의미 토큰 warning 색(bg-warning-surface·text-warning)을 쓴다", () => {
    setNavigatorOnLine(false);
    render(<OfflineBanner />);
    const banner = screen.getByText("인터넷 연결이 끊겼어요");
    expect(banner.className).toContain("bg-warning-surface");
    expect(banner.className).toContain("text-warning");
  });

  it("상단에 고정 배치된다", () => {
    setNavigatorOnLine(false);
    render(<OfflineBanner />);
    const banner = screen.getByText("인터넷 연결이 끊겼어요");
    expect(banner.className).toContain("fixed");
    expect(banner.className).toContain("top-0");
  });
});

describe("OfflineBanner — shell-row (헤더의 셋째 줄)", () => {
  it("온라인이면 아무것도 렌더하지 않는다", () => {
    setNavigatorOnLine(true);
    render(<OfflineBanner variant="shell-row" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("오프라인이면 아이콘과 함께 안내 문구 전체를 보여준다", () => {
    setNavigatorOnLine(false);
    render(<OfflineBanner variant="shell-row" />);
    expect(
      screen.getByText("인터넷 연결이 끊겼어요 · 지금은 보기만 할 수 있어요"),
    ).toBeInTheDocument();
  });

  it("행으로 흐르고 스스로 고정되지 않는다 — 부모(헤더)가 위치를 정한다", () => {
    setNavigatorOnLine(false);
    render(<OfflineBanner variant="shell-row" />);
    const row = screen.getByRole("status");
    expect(row.className).not.toContain("fixed");
    expect(row.className).toContain("bg-warning-surface");
    expect(row.className).toContain("text-warning");
  });
});
