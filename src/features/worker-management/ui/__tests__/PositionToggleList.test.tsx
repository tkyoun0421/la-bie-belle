import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PositionToggleList } from "@/features/worker-management/ui/PositionToggleList";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const POSITIONS = [
  { id: "pos-default", name: "안내", isDefault: true, granted: true },
  { id: "pos-scan", name: "스캔", isDefault: false, granted: true },
  { id: "pos-main", name: "메인", isDefault: false, granted: false },
];

describe("PositionToggleList", () => {
  it("기본 포지션은 기본 적용 뱃지를 보여준다", () => {
    render(<PositionToggleList positions={POSITIONS} onGrant={vi.fn()} onRevoke={vi.fn()} />);

    expect(screen.getByText("기본 적용")).toBeInTheDocument();
  });

  it("부여된 비기본 포지션은 회수 버튼을, 아닌 포지션은 부여 버튼을 보여준다", () => {
    render(<PositionToggleList positions={POSITIONS} onGrant={vi.fn()} onRevoke={vi.fn()} />);

    expect(screen.getByRole("button", { name: "회수" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "부여" })).toBeInTheDocument();
  });

  it("부여 버튼을 누르면 해당 포지션 id로 onGrant를 호출한다", async () => {
    const onGrant = vi.fn().mockResolvedValue({ ok: true });
    render(<PositionToggleList positions={POSITIONS} onGrant={onGrant} onRevoke={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "부여" }));

    await vi.waitFor(() => expect(onGrant).toHaveBeenCalled());
    expect(onGrant.mock.calls[0]?.[0]).toBe("pos-main");
  });

  it("회수 버튼을 누르면 해당 포지션 id로 onRevoke를 호출한다", async () => {
    const onRevoke = vi.fn().mockResolvedValue({ ok: true });
    render(<PositionToggleList positions={POSITIONS} onGrant={vi.fn()} onRevoke={onRevoke} />);

    fireEvent.click(screen.getByRole("button", { name: "회수" }));

    await vi.waitFor(() => expect(onRevoke).toHaveBeenCalled());
    expect(onRevoke.mock.calls[0]?.[0]).toBe("pos-scan");
  });
});
