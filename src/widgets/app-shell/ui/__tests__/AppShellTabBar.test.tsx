import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { AppShellTabBar } from "@/widgets/app-shell/ui/AppShellTabBar";

afterEach(cleanup);

describe("AppShellTabBar", () => {
  it("홈·일정·급여·전체 4개 탭을 아이콘과 텍스트로 렌더한다", () => {
    render(<AppShellTabBar />);

    expect(screen.getByRole("link", { name: "홈" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "일정" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "급여" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전체" })).toBeInTheDocument();
  });

  it("현재 경로의 탭에 aria-current=page를 표시한다", () => {
    render(<AppShellTabBar />);

    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "일정" })).not.toHaveAttribute("aria-current");
  });

  it("선택된 탭은 채움 path를 그리고 gray-800로 진해진다 — 파랑을 쓰지 않는다", () => {
    render(<AppShellTabBar />);

    const activeLink = screen.getByRole("link", { name: "홈" });
    expect(activeLink.className).toContain("text-ink-800");
    expect(activeLink.className).not.toContain("text-action");

    const activeIcon = activeLink.querySelector("svg");
    expect(activeIcon?.querySelector('path[fill="currentColor"]')).not.toBeNull();
    expect(activeIcon?.querySelector('[stroke="currentColor"]')).toBeNull();
  });

  it("선택 안 된 탭은 획 path 그대로다", () => {
    render(<AppShellTabBar />);

    const inactiveLink = screen.getByRole("link", { name: "일정" });
    const inactiveIcon = inactiveLink.querySelector("svg");
    expect(inactiveIcon?.querySelector('path[fill="currentColor"]')).toBeNull();
    expect(inactiveIcon?.querySelector('[stroke="currentColor"]')).not.toBeNull();
  });

  it("탭을 누르면 그 아이콘에 눌림 애니메이션 클래스가 붙는다", () => {
    render(<AppShellTabBar />);

    const scheduleLink = screen.getByRole("link", { name: "일정" });
    expect(scheduleLink.querySelector("svg")?.classList.contains("motion-tab-press")).toBe(false);

    fireEvent.click(scheduleLink);

    expect(scheduleLink.querySelector("svg")?.classList.contains("motion-tab-press")).toBe(true);
  });

  it("같은 탭을 두 번 누르면 아이콘이 다시 만들어져 두 번째 눌림도 재생된다", () => {
    render(<AppShellTabBar />);

    const scheduleLink = screen.getByRole("link", { name: "일정" });
    fireEvent.click(scheduleLink);
    const firstIcon = scheduleLink.querySelector("svg");

    fireEvent.click(scheduleLink);
    const secondIcon = scheduleLink.querySelector("svg");

    expect(secondIcon).not.toBe(firstIcon);
  });
});
