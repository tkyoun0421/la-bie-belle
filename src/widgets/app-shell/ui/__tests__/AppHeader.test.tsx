import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

import { AppHeader } from "@/widgets/app-shell/ui/AppHeader";

afterEach(() => {
  cleanup();
  mockPathname = "/";
});

describe("AppHeader", () => {
  it("경로에 맞는 화면 제목을 왼쪽에 보여준다", () => {
    mockPathname = "/";
    render(<AppHeader hasUnreadNotifications={false} />);
    expect(within(screen.getByTestId("app-header-shell")).getByText("홈")).toBeInTheDocument();

    cleanup();
    mockPathname = "/schedule";
    render(<AppHeader hasUnreadNotifications={false} />);
    expect(within(screen.getByTestId("app-header-shell")).getByText("일정")).toBeInTheDocument();
  });

  it("종은 화면에 접근 가능한 것이 하나뿐이다 — 레이아웃 예비용 사본은 aria-hidden이다", () => {
    render(<AppHeader hasUnreadNotifications={false} />);
    expect(screen.getAllByRole("link", { name: "알림" })).toHaveLength(1);
  });

  it("화면 제목은 h1이고 접근 가능한 것이 하나뿐이다 — 레이아웃 예비용 사본은 aria-hidden이다", () => {
    render(<AppHeader hasUnreadNotifications={false} />);
    expect(screen.getByRole("heading", { level: 1, name: "홈" })).toBeInTheDocument();
  });

  it("읽지 않은 알림이 있으면 종에 점이 뜨고 접근 가능한 이름에도 읽지 않음이 실린다", () => {
    render(<AppHeader hasUnreadNotifications />);
    const bell = screen.getByRole("link", { name: /읽지 않음/ });
    expect(bell.querySelector("span[aria-hidden]")).not.toBeNull();
    expect(bell).toHaveAccessibleName(/알림/);
  });

  it("읽지 않은 알림이 없으면 점이 없고 이름도 그냥 알림이다", () => {
    render(<AppHeader hasUnreadNotifications={false} />);
    const bell = screen.getByRole("link", { name: "알림" });
    expect(bell.querySelector("span[aria-hidden]")).toBeNull();
  });

  it("배경은 그라디언트가 아니라 반투명 유리다 — 지면색 50% + blur(9px)", () => {
    render(<AppHeader hasUnreadNotifications={false} />);
    const shell = screen.getByTestId("app-header-shell");
    expect(shell.className).toContain("bg-canvas/50");
    expect(shell.className).toContain("backdrop-blur-[9px]");
    expect(shell.className).not.toMatch(/gradient/);
  });

  it("실제로 화면 위에 뜬 사본은 fixed, 자리만 잡는 사본은 in-flow다", () => {
    render(<AppHeader hasUnreadNotifications={false} />);
    expect(screen.getByTestId("app-header-shell").className).toContain("fixed");
    expect(screen.getByTestId("app-header-spacer").className).not.toContain("fixed");
  });

  it("셋째 줄(오프라인 배너)은 밖에서 채워 넣은 자리다 — 보이는 사본과 예비 사본 양쪽에 선다", () => {
    render(<AppHeader hasUnreadNotifications={false} bannerSlot={<p>인터넷 연결이 끊겼어요</p>} />);

    expect(
      within(screen.getByTestId("app-header-shell")).getByText("인터넷 연결이 끊겼어요"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("app-header-spacer")).getByText("인터넷 연결이 끊겼어요"),
    ).toBeInTheDocument();
  });
});
