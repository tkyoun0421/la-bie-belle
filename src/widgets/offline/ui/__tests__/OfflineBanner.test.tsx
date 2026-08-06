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

describe("OfflineBanner", () => {
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
