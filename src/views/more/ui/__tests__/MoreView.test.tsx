import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MoreView } from "@/views/more/ui/MoreView";

afterEach(cleanup);

describe("MoreView", () => {
  it("역할이 없으면 예상 급여·내 정보·알림 설정 진입 항목만 갖는다", () => {
    render(<MoreView onSignOut={vi.fn()} roles={[]} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", "/pay");
    expect(links[0]).toHaveTextContent("예상 급여");
    expect(links[1]).toHaveAttribute("href", "/my-profile");
    expect(links[1]).toHaveTextContent("내 정보");
    expect(links[2]).toHaveAttribute("href", "/more/notification-settings");
    expect(links[2]).toHaveTextContent("알림 설정");
  });

  it("로그아웃 버튼을 렌더한다", () => {
    render(<MoreView onSignOut={vi.fn()} roles={[]} />);

    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  });

  it("admin 역할이 있으면 관리자 진입 링크를 보여준다", () => {
    render(<MoreView onSignOut={vi.fn()} roles={["worker", "admin"]} />);

    const link = screen.getByRole("link", { name: /관리자/ });
    expect(link).toHaveAttribute("href", "/admin");
  });

  it("super_admin 역할이 있어도 관리자 진입 링크를 보여준다", () => {
    render(<MoreView onSignOut={vi.fn()} roles={["worker", "admin", "super_admin"]} />);

    expect(screen.getByRole("link", { name: /관리자/ })).toBeInTheDocument();
  });

  it("역할이 없으면 관리자 진입 링크가 없다", () => {
    render(<MoreView onSignOut={vi.fn()} roles={["worker"]} />);

    expect(screen.queryByRole("link", { name: /관리자/ })).not.toBeInTheDocument();
  });
});
