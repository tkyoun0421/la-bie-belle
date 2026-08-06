import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Calendar } from "@/shared/ui/calendar";

afterEach(cleanup);

const MONTH = new Date(2026, 7, 1);

const DATE_STATES = [
  { date: new Date(2026, 7, 3), state: "none" as const },
  { date: new Date(2026, 7, 10), state: "open" as const },
  { date: new Date(2026, 7, 17), state: "confirmed" as const },
];

describe("Calendar", () => {
  it("모집 없음 날짜는 접근 이름에 상태를 담고 비활성화된다", () => {
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={() => {}} />);

    const cell = screen.getByRole("button", { name: "8월 3일 모집 없음" });
    expect(cell).toBeDisabled();
  });

  it("확정 날짜는 흐리게 막지 않고 탭할 수 있다", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={onSelectDate} />);

    const cell = screen.getByRole("button", { name: "8월 17일 확정" });
    expect(cell).not.toBeDisabled();

    await user.click(cell);

    expect(onSelectDate).toHaveBeenCalledWith(new Date(2026, 7, 17));
  });

  it("신청 가능한 날짜를 탭하면 onSelectDate가 호출된다", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={onSelectDate} />);

    await user.click(screen.getByRole("button", { name: "8월 10일 신청 가능" }));

    expect(onSelectDate).toHaveBeenCalledWith(new Date(2026, 7, 10));
  });

  it("일요일이 첫 요일이다", () => {
    const { container } = render(
      <Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={() => {}} />,
    );

    const headers = container.querySelectorAll("thead th");
    expect(headers[0]).toHaveTextContent("일");
  });
});
