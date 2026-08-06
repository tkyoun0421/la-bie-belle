import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { AppShellTabBar } from "@/widgets/app-shell/ui/AppShellTabBar";

afterEach(cleanup);

describe("AppShellTabBar", () => {
  it("홈·일정·알림·전체 4개 탭을 아이콘과 텍스트로 렌더한다", () => {
    render(<AppShellTabBar hasUnreadNotifications={false} />);

    expect(screen.getByRole("link", { name: "홈" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "일정" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "알림" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전체" })).toBeInTheDocument();
  });

  it("현재 경로의 탭에 aria-current=page를 표시한다", () => {
    render(<AppShellTabBar hasUnreadNotifications={false} />);

    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "일정" })).not.toHaveAttribute("aria-current");
  });

  it("읽지 않은 알림이 있으면 점 표시를 추가한다", () => {
    render(<AppShellTabBar hasUnreadNotifications />);

    const notificationsLink = screen.getByRole("link", { name: "알림" });
    expect(notificationsLink.querySelector("span[aria-hidden]")).not.toBeNull();
  });

  it("읽지 않은 알림이 없으면 점 표시가 없다", () => {
    render(<AppShellTabBar hasUnreadNotifications={false} />);

    const notificationsLink = screen.getByRole("link", { name: "알림" });
    expect(notificationsLink.querySelector("span[aria-hidden]")).toBeNull();
  });
});
