import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RoleActionButtons } from "@/features/role-management/ui/RoleActionButtons";

afterEach(cleanup);

describe("RoleActionButtons", () => {
  it("admin이 아니면 임명 버튼을 렌더한다", () => {
    render(<RoleActionButtons isAdmin={false} onGrant={vi.fn()} onRevoke={vi.fn()} />);

    expect(screen.getByRole("button", { name: "임명" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "해제" })).not.toBeInTheDocument();
  });

  it("admin이면 해제 버튼을 렌더한다", () => {
    render(<RoleActionButtons isAdmin={true} onGrant={vi.fn()} onRevoke={vi.fn()} />);

    expect(screen.getByRole("button", { name: "해제" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "임명" })).not.toBeInTheDocument();
  });
});
