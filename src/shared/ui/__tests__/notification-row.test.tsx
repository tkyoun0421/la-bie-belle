import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NotificationRow } from "@/shared/ui/notification-row";

afterEach(cleanup);

describe("NotificationRow", () => {
  it("제목·내용·상대 시각을 표시한다", () => {
    render(
      <NotificationRow
        title="근무 배정이 확정됐어요"
        body="8월 3일 플로어 근무가 확정됐어요"
        relativeTime="3시간 전"
        unread={false}
        onPress={() => {}}
      />,
    );

    expect(screen.getByText("근무 배정이 확정됐어요")).toBeInTheDocument();
    expect(screen.getByText("8월 3일 플로어 근무가 확정됐어요")).toBeInTheDocument();
    const relativeTime = screen.getByText("3시간 전");
    expect(relativeTime).toBeInTheDocument();
    expect(relativeTime).toHaveClass("text-text");
    expect(relativeTime).not.toHaveClass("text-text-weak");
  });

  it("읽지 않음이면 점 표시와 강한 제목을 함께 쓰고 접근 이름에도 알린다", () => {
    render(
      <NotificationRow
        title="근무 배정이 확정됐어요"
        body="8월 3일 플로어 근무가 확정됐어요"
        relativeTime="3시간 전"
        unread
        onPress={() => {}}
      />,
    );

    expect(screen.getByText("근무 배정이 확정됐어요")).toHaveClass("typo-body-strong");
    expect(screen.getByRole("button")).toHaveAccessibleName(/읽지 않음/);
  });

  it("읽음 상태에서는 접근 이름에 읽지 않음이 없다", () => {
    render(
      <NotificationRow
        title="근무 배정이 확정됐어요"
        body="8월 3일 플로어 근무가 확정됐어요"
        relativeTime="3시간 전"
        unread={false}
        onPress={() => {}}
      />,
    );

    expect(screen.getByRole("button")).not.toHaveAccessibleName(/읽지 않음/);
  });

  it("접근 가능한 이름에 본문과 상대 시각도 포함된다(aria-label이 콘텐츠를 덮지 않는다)", () => {
    render(
      <NotificationRow
        title="근무 배정이 확정됐어요"
        body="8월 3일 플로어 근무가 확정됐어요"
        relativeTime="3시간 전"
        unread={false}
        onPress={() => {}}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAccessibleName(/8월 3일 플로어 근무가 확정됐어요/);
    expect(button).toHaveAccessibleName(/3시간 전/);
  });

  it("탭하면 onPress가 호출된다", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <NotificationRow
        title="근무 배정이 확정됐어요"
        body="8월 3일 플로어 근무가 확정됐어요"
        relativeTime="3시간 전"
        unread={false}
        onPress={onPress}
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(onPress).toHaveBeenCalledOnce();
  });
});
