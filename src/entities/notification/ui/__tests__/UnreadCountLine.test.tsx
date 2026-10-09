import { fireEvent, render } from "@testing-library/react-native";
import { UNREAD_COUNT_COPY } from "@/entities/notification/consts/unreadCount.const";
import { UnreadCountFailed } from "@/entities/notification/ui/UnreadCountFailed";
import { UnreadCountLoading } from "@/entities/notification/ui/UnreadCountLoading";

describe("안 읽은 수의 상태마다의 조각", () => {
  it("기다리는 자리가 세는 중을 말한다", () => {
    const { getByText } = render(<UnreadCountLoading />);

    expect(getByText(UNREAD_COUNT_COPY.loading)).toBeTruthy();
  });

  it("실패 자리가 못 셌다고 말하고 다시 세는 손을 든다", () => {
    const onRetry = jest.fn();
    const { getByText } = render(<UnreadCountFailed onRetry={onRetry} />);

    expect(getByText(UNREAD_COUNT_COPY.failed)).toBeTruthy();

    fireEvent.press(getByText(UNREAD_COUNT_COPY.retry));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
