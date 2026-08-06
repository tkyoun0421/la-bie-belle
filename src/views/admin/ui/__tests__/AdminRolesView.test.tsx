import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminRolesView } from "@/views/admin/ui/AdminRolesView";

afterEach(cleanup);

const PROFILES = [
  { id: "profile-worker", name: "워커근무자", roles: ["worker" as const] },
  { id: "profile-admin", name: "관리자근무자", roles: ["worker" as const, "admin" as const] },
  {
    id: "profile-super",
    name: "슈퍼관리자",
    roles: ["worker" as const, "admin" as const, "super_admin" as const],
  },
];

describe("AdminRolesView", () => {
  it("active 근무자 각각의 이름과 역할을 렌더한다", () => {
    render(<AdminRolesView profiles={PROFILES} onGrant={vi.fn()} onRevoke={vi.fn()} />);

    expect(screen.getByText("워커근무자")).toBeInTheDocument();
    expect(screen.getByText("관리자근무자")).toBeInTheDocument();
    expect(screen.getByText("슈퍼관리자")).toBeInTheDocument();
  });

  it("worker 행은 임명 버튼을 갖는다", () => {
    render(<AdminRolesView profiles={PROFILES} onGrant={vi.fn()} onRevoke={vi.fn()} />);

    const row = screen.getByText("워커근무자").closest("li");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByRole("button", { name: "임명" })).toBeInTheDocument();
  });

  it("admin 행은 해제 버튼을 갖는다", () => {
    render(<AdminRolesView profiles={PROFILES} onGrant={vi.fn()} onRevoke={vi.fn()} />);

    const row = screen.getByText("관리자근무자").closest("li");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByRole("button", { name: "해제" })).toBeInTheDocument();
  });

  it("super_admin 행은 임명·해제 버튼이 없다(화면 임명·해제는 비목표)", () => {
    render(<AdminRolesView profiles={PROFILES} onGrant={vi.fn()} onRevoke={vi.fn()} />);

    const row = screen.getByText("슈퍼관리자").closest("li");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
  });
});
