import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkerStatusAction } from "@/features/worker-management/ui/WorkerStatusAction";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WorkerStatusAction", () => {
  it("active 상태면 수동 휴면 버튼을 보여준다", () => {
    render(<WorkerStatusAction status="active" onDeactivate={vi.fn()} onReactivate={vi.fn()} />);

    expect(screen.getByRole("button", { name: "수동 휴면" })).toBeInTheDocument();
  });

  it("dormant 상태면 재활성화 버튼을 보여준다", () => {
    render(<WorkerStatusAction status="dormant" onDeactivate={vi.fn()} onReactivate={vi.fn()} />);

    expect(screen.getByRole("button", { name: "재활성화" })).toBeInTheDocument();
  });

  it("pending 상태면 아무 버튼도 보여주지 않는다", () => {
    render(<WorkerStatusAction status="pending" onDeactivate={vi.fn()} onReactivate={vi.fn()} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("수동 휴면 확인을 누르면 onDeactivate를 호출한다", async () => {
    const user = userEvent.setup();
    const onDeactivate = vi.fn().mockResolvedValue({ ok: true });
    render(
      <WorkerStatusAction status="active" onDeactivate={onDeactivate} onReactivate={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "수동 휴면" }));
    await user.click(screen.getByRole("button", { name: "휴면 처리" }));

    expect(onDeactivate).toHaveBeenCalledOnce();
  });

  it("재활성화 확인을 누르면 onReactivate를 호출한다", async () => {
    const user = userEvent.setup();
    const onReactivate = vi.fn().mockResolvedValue({ ok: true });
    render(
      <WorkerStatusAction status="dormant" onDeactivate={vi.fn()} onReactivate={onReactivate} />,
    );

    await user.click(screen.getByRole("button", { name: "재활성화" }));
    await user.click(screen.getByRole("button", { name: "재활성화하기" }));

    expect(onReactivate).toHaveBeenCalledOnce();
  });
});
