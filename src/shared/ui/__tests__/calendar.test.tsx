import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Calendar } from "@/shared/ui/calendar";

afterEach(cleanup);

const MONTH = new Date(2026, 7, 1);

const DATE_STATES = [
  { date: new Date(2026, 7, 2), state: "none" as const },
  { date: new Date(2026, 7, 3), state: "open" as const },
  { date: new Date(2026, 7, 4), state: "selected" as const },
  { date: new Date(2026, 7, 5), state: "requested" as const },
  { date: new Date(2026, 7, 6), state: "closed" as const },
  { date: new Date(2026, 7, 7), state: "confirmed" as const },
];

describe("Calendar", () => {
  it("모집 없음 날짜는 접근 이름에 상태를 담고 비활성화된다", () => {
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={() => {}} />);

    const cell = screen.getByRole("button", { name: "8월 2일 모집 없음" });
    expect(cell).toBeDisabled();
  });

  it("모집 중, 미신청 날짜는 탭해 선택할 수 있다", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={onSelectDate} />);

    const cell = screen.getByRole("button", { name: "8월 3일 신청 가능" });
    expect(cell).not.toBeDisabled();

    await user.click(cell);

    expect(onSelectDate).toHaveBeenCalledWith(new Date(2026, 7, 3));
  });

  it("로컬 선택 상태는 색상과 함께 체크 아이콘으로 구분된다", () => {
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={() => {}} />);

    const cell = screen.getByRole("button", { name: "8월 4일 선택됨" });
    expect(cell.querySelector("svg")).not.toBeNull();
  });

  it("신청 완료 상태는 '신청' 배지를 색과 함께 렌더한다", () => {
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={() => {}} />);

    const cell = screen.getByRole("button", { name: "8월 5일 신청" });
    expect(cell.textContent).toContain("신청");
  });

  it("모집 마감 날짜는 '마감' 배지를 렌더하고 흐리게 막지 않는다(탭 가능)", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={onSelectDate} />);

    const cell = screen.getByRole("button", { name: "8월 6일 마감" });
    expect(cell.textContent).toContain("마감");
    expect(cell).not.toBeDisabled();

    await user.click(cell);
    expect(onSelectDate).toHaveBeenCalledWith(new Date(2026, 7, 6));
  });

  it("확정 날짜는 '확정' 배지를 렌더하고 흐리게 막지 않는다(탭 가능)", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={onSelectDate} />);

    const cell = screen.getByRole("button", { name: "8월 7일 확정" });
    expect(cell.textContent).toContain("확정");
    expect(cell).not.toBeDisabled();

    await user.click(cell);
    expect(onSelectDate).toHaveBeenCalledWith(new Date(2026, 7, 7));
  });

  it("신청과 마감은 배지 문구로 구분되고 클래스만으로 동일하지 않다", () => {
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={() => {}} />);

    const requested = screen.getByRole("button", { name: "8월 5일 신청" });
    const closed = screen.getByRole("button", { name: "8월 6일 마감" });
    expect(requested.textContent).not.toBe(closed.textContent);
  });

  it("일요일이 첫 요일이다", () => {
    const { container } = render(
      <Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={() => {}} />,
    );

    const headers = container.querySelectorAll("thead th");
    expect(headers[0]).toHaveTextContent("일");
  });

  it("리렌더에도 셀 DOM이 유지돼 포커스를 잃지 않는다(remount 없음)", () => {
    const { rerender } = render(
      <Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={() => {}} />,
    );
    const cell = screen.getByRole("button", { name: "8월 3일 신청 가능" });
    cell.focus();
    expect(cell).toHaveFocus();

    rerender(<Calendar month={MONTH} dateStates={[...DATE_STATES]} onSelectDate={() => {}} />);

    expect(document.activeElement).toBe(cell);
  });

  it("오늘 날짜 셀에 action outline을 표시한다", () => {
    render(
      <Calendar
        month={MONTH}
        dateStates={DATE_STATES}
        onSelectDate={() => {}}
        today={new Date(2026, 7, 3)}
      />,
    );

    const cell = screen.getByRole("button", { name: "8월 3일 신청 가능" });
    expect(cell).toHaveClass("ring-action");
  });

  it("날짜 숫자에 tabular-nums를 적용한다", () => {
    render(<Calendar month={MONTH} dateStates={DATE_STATES} onSelectDate={() => {}} />);

    const cell = screen.getByRole("button", { name: "8월 3일 신청 가능" });
    const digit = cell.querySelector(".tabular-nums");
    expect(digit).not.toBeNull();
    expect(digit).toHaveTextContent("3");
  });

  it("selectable 상태 셀은 접근 이름에 상태를 담고 탭해 선택할 수 있다", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(
      <Calendar
        month={MONTH}
        dateStates={[{ date: new Date(2026, 7, 8), state: "selectable" }]}
        onSelectDate={onSelectDate}
      />,
    );

    const cell = screen.getByRole("button", { name: "8월 8일 선택 가능" });
    expect(cell).not.toBeDisabled();

    await user.click(cell);
    expect(onSelectDate).toHaveBeenCalledWith(new Date(2026, 7, 8));
  });

  it("disabled를 명시하지 않으면 selectable 상태는 비활성화되지 않는다(하위 호환 기본값)", () => {
    render(
      <Calendar
        month={MONTH}
        dateStates={[{ date: new Date(2026, 7, 9), state: "selectable" }]}
        onSelectDate={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "8월 9일 선택 가능" })).not.toBeDisabled();
  });

  it("disabled:true를 명시하면 none이 아닌 상태도 비활성화되고 disabled 시각 표현을 쓴다", () => {
    render(
      <Calendar
        month={MONTH}
        dateStates={[{ date: new Date(2026, 7, 10), state: "open", disabled: true }]}
        onSelectDate={() => {}}
      />,
    );

    const cell = screen.getByRole("button", { name: "8월 10일 신청 가능" });
    expect(cell).toBeDisabled();
    expect(cell).toHaveClass("bg-disabled-surface");
  });

  it("disabled:true인 셀을 탭해도 onSelectDate가 호출되지 않는다", async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(
      <Calendar
        month={MONTH}
        dateStates={[{ date: new Date(2026, 7, 11), state: "open", disabled: true }]}
        onSelectDate={onSelectDate}
      />,
    );

    const cell = screen.getByRole("button", { name: "8월 11일 신청 가능" });
    await user.click(cell);
    expect(onSelectDate).not.toHaveBeenCalled();
  });
});
