import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CSSProperties } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NotificationRow } from "@/shared/ui/notification-row";

function swipe(element: Element, distance: number) {
  fireEvent.pointerDown(element, { clientX: 0, clientY: 0 });
  fireEvent.pointerMove(element, { clientX: distance, clientY: 0 });
  fireEvent.pointerUp(element, { clientX: distance, clientY: 0 });
}

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

  it("onSwipeRead가 없으면 스와이프해도 아무 일도 일어나지 않는다", () => {
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

    swipe(screen.getByRole("button"), 200);

    expect(onPress).not.toHaveBeenCalled();
  });

  it("임계값을 넘겨 스와이프하면 onSwipeRead가 호출되고 onPress는 호출되지 않는다", () => {
    const onPress = vi.fn();
    const onSwipeRead = vi.fn();
    render(
      <NotificationRow
        title="근무 배정이 확정됐어요"
        body="8월 3일 플로어 근무가 확정됐어요"
        relativeTime="3시간 전"
        unread
        onPress={onPress}
        onSwipeRead={onSwipeRead}
      />,
    );

    swipe(screen.getByRole("button"), 200);
    fireEvent.click(screen.getByRole("button"));

    expect(onSwipeRead).toHaveBeenCalledOnce();
    expect(onPress).not.toHaveBeenCalled();
  });

  it("임계값 전에 놓으면 onSwipeRead가 호출되지 않고 탭도 그대로 동작한다", () => {
    const onPress = vi.fn();
    const onSwipeRead = vi.fn();
    render(
      <NotificationRow
        title="근무 배정이 확정됐어요"
        body="8월 3일 플로어 근무가 확정됐어요"
        relativeTime="3시간 전"
        unread
        onPress={onPress}
        onSwipeRead={onSwipeRead}
      />,
    );

    swipe(screen.getByRole("button"), 10);
    fireEvent.click(screen.getByRole("button"));

    expect(onSwipeRead).not.toHaveBeenCalled();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("순차 등장 className·style은 스와이프 transform을 담는 버튼이 아니라 바깥 요소에 붙는다", () => {
    const { container } = render(
      <NotificationRow
        title="근무 배정이 확정됐어요"
        body="8월 3일 플로어 근무가 확정됐어요"
        relativeTime="3시간 전"
        unread={false}
        onPress={() => {}}
        className="motion-stagger-item"
        style={{ "--stagger-index": 2 } as CSSProperties}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).not.toHaveClass("motion-stagger-item");
    expect(button.style.getPropertyValue("--stagger-index")).toBe("");

    const wrapper = container.firstElementChild;
    expect(wrapper).not.toBe(button);
    expect(wrapper).toHaveClass("motion-stagger-item");
    expect(wrapper?.getAttribute("style")).toContain("--stagger-index: 2");
  });

  it("스와이프 중에도 버튼의 인라인 transform이 바깥 요소의 애니메이션과 무관하게 오프셋을 반영한다", () => {
    render(
      <NotificationRow
        title="근무 배정이 확정됐어요"
        body="8월 3일 플로어 근무가 확정됐어요"
        relativeTime="3시간 전"
        unread
        onPress={() => {}}
        onSwipeRead={() => {}}
        className="motion-stagger-item"
      />,
    );

    const button = screen.getByRole("button");
    fireEvent.pointerDown(button, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(button, { clientX: 40, clientY: 0 });

    expect(button.style.transform).toBe("translateX(40px)");
  });
});
