import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NotificationsView } from "@/views/notifications/ui/NotificationsView";
import {
  NOTIFICATIONS_ALL_READ,
  NOTIFICATIONS_EMPTY,
  NOTIFICATIONS_MIXED,
} from "@/views/notifications/ui/notifications.mock";

afterEach(cleanup);

describe("NotificationsView", () => {
  it("오늘·이번 주·이전 구획으로 나눠 렌더한다", () => {
    render(<NotificationsView {...NOTIFICATIONS_MIXED} onNavigate={() => {}} />);

    expect(screen.getByText("오늘")).toBeInTheDocument();
    expect(screen.getByText("이번 주")).toBeInTheDocument();
    expect(screen.getByText("이전")).toBeInTheDocument();
  });

  it("항목을 탭하면 onNavigate가 호출되고 읽음으로 바뀐다", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<NotificationsView {...NOTIFICATIONS_MIXED} onNavigate={onNavigate} />);

    const row = screen.getByText("근무 배정이 확정됐어요").closest("button")!;
    expect(row).toHaveAccessibleName(/읽지 않음/);

    await user.click(row);

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(row).not.toHaveAccessibleName(/읽지 않음/);
  });

  it("모두 읽음을 누르면 모든 항목의 읽지 않음 표시가 사라진다", async () => {
    const user = userEvent.setup();
    render(<NotificationsView {...NOTIFICATIONS_MIXED} onNavigate={() => {}} />);

    await user.click(screen.getByRole("button", { name: "모두 읽음" }));

    expect(screen.getByText("근무 배정이 확정됐어요").closest("button")).not.toHaveAccessibleName(
      /읽지 않음/,
    );
  });

  it("이미 전체 읽음이면 모두 읽음 버튼이 비활성이다", () => {
    render(<NotificationsView {...NOTIFICATIONS_ALL_READ} onNavigate={() => {}} />);

    expect(screen.getByRole("button", { name: "모두 읽음" })).toBeDisabled();
  });

  it("빈 상태는 안내 문구를 보여준다", () => {
    render(<NotificationsView {...NOTIFICATIONS_EMPTY} onNavigate={() => {}} />);

    expect(screen.getByText("아직 알림이 없어요")).toBeInTheDocument();
  });
});
