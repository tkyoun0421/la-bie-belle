import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, Ref } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeView } from "@/views/home/ui/HomeView";
import {
  HOME_ALL_EMPTY,
  HOME_ALL_FAILED,
  HOME_BASIC,
  HOME_BEFORE_WINDOW,
  HOME_LOADING,
  HOME_NO_SHIFT_TODAY,
  HOME_OVERDUE,
  HOME_PARTIAL_FAILURE,
  HOME_WINDOW_OPEN,
} from "@/views/home/ui/home.mock";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("next/link", () => ({
  default: ({
    href,
    transitionTypes,
    children,
    ref,
    ...rest
  }: {
    href: string;
    transitionTypes?: string[];
    children: ReactNode;
    ref?: Ref<HTMLAnchorElement>;
  }) => (
    <a href={href} ref={ref} data-transition-types={transitionTypes?.join(",")} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

function setNavigatorOnLine(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("HomeView — 기본", () => {
  it("알림 · 오늘 · 이번 주 · 다가오는 근무 · 급여 다섯 블록을 세운다", () => {
    render(<HomeView {...HOME_BASIC} />);

    expect(screen.getByText("8월 22일 공석")).toBeInTheDocument();
    expect(screen.getByText("1:18:59")).toBeInTheDocument();
    expect(screen.getByText("주급 · 3회 15시간")).toBeInTheDocument();
    expect(screen.getByText("접수 · 10:00 ~ 15:00")).toBeInTheDocument();
    expect(screen.getByText("지난주 · 2회 11시간")).toBeInTheDocument();
  });

  it("다가오는 근무의 D 배지가 D-1 · D-2 · D-4 순서로 선다", () => {
    render(<HomeView {...HOME_BASIC} />);
    expect(screen.getByText("D-1")).toBeInTheDocument();
    expect(screen.getByText("D-2")).toBeInTheDocument();
    expect(screen.getByText("D-4")).toBeInTheDocument();
  });

  it("금액은 기본적으로 가려져 있다", () => {
    render(<HomeView {...HOME_BASIC} />);
    expect(screen.getAllByRole("button", { name: "금액 보기" }).length).toBeGreaterThan(0);
  });

  it("금액 하나를 열면 화면의 나머지 금액도 함께 열린다", async () => {
    const user = userEvent.setup();
    render(<HomeView {...HOME_BASIC} />);

    const [firstRevealButton] = screen.getAllByRole("button", { name: "금액 보기" });
    await user.click(firstRevealButton!);

    expect(screen.getByText("132,000원")).toBeInTheDocument();
    expect(screen.getByText("360,000원")).toBeInTheDocument();
  });
});

describe("HomeView — 오늘 블록의 세 상태", () => {
  it("인증 창이 열리기 전에는 열리는 시각과 함께 회색(비활성) 버튼을 보여준다", () => {
    render(<HomeView {...HOME_BEFORE_WINDOW} />);

    expect(screen.getByText("09:00부터 인증 가능")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "출근 인증하기" })).toBeDisabled();
  });

  it("인증 창이 열린 뒤에는 예정 시각까지 남은 시간과 활성 버튼을 보여준다", () => {
    render(<HomeView {...HOME_WINDOW_OPEN} />);

    expect(screen.getByText("퇴근 시각까지")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "퇴근 인증하기" })).toBeEnabled();
  });

  it("예정 시각을 지나면 경과 시간이 +로 뒤집히고 그래도 인증할 수 있다", () => {
    render(<HomeView {...HOME_OVERDUE} />);

    expect(screen.getByText("+0:12:04")).toBeInTheDocument();
    expect(screen.getByText("출근 시각에서 지남")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "출근 인증하기" })).toBeEnabled();
  });
});

describe("HomeView — 빈 상태", () => {
  it("근무 없는 날은 오늘 블록이 통째로 사라진다", () => {
    render(<HomeView {...HOME_NO_SHIFT_TODAY} />);

    expect(screen.queryByRole("button", { name: "출근 인증하기" })).toBeNull();
    expect(screen.queryByRole("button", { name: "퇴근 인증하기" })).toBeNull();
    expect(screen.queryByText(/포지션 보기/)).toBeNull();
  });

  it("알림 없음 · 오늘 없음 · 빈 주 · 다가오는 근무 없음 · 급여 없음이 계약대로 렌더된다", () => {
    render(<HomeView {...HOME_ALL_EMPTY} />);

    expect(screen.queryByText(/공석|스케줄 확정|배정 변경/)).toBeNull();
    expect(screen.getByText("이번 주 근무가 없어요")).toBeInTheDocument();
    expect(screen.getByText("다가오는 근무가 없어요")).toBeInTheDocument();
    expect(screen.getByText("아직 계산할 급여가 없어요")).toBeInTheDocument();
  });
});

describe("HomeView — 로딩과 실패", () => {
  it("로딩 상태는 실제 값을 렌더하지 않는다", () => {
    render(<HomeView {...HOME_LOADING} />);

    expect(screen.queryByText("주급 · 3회 15시간")).toBeNull();
    expect(screen.queryByText("D-1")).toBeNull();
  });

  it("일부 블록만 실패해도 나머지 블록은 그대로 산다", () => {
    render(<HomeView {...HOME_PARTIAL_FAILURE} />);

    expect(screen.getByText("다가오는 근무를 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByText("급여를 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByText("8월 22일 공석")).toBeInTheDocument();
    expect(screen.getByText("주급 · 3회 15시간")).toBeInTheDocument();
  });

  it("전부 실패하면 다섯 블록 모두 실패 문구와 다시 시도 버튼을 보여준다", () => {
    render(<HomeView {...HOME_ALL_FAILED} />);

    expect(screen.getByText("알림을 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByText("오늘 근무를 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByText("이번 주를 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByText("다가오는 근무를 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByText("급여를 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "다시 시도" }).length).toBe(5);
  });
});

describe("HomeView — 카운트다운 시계는 살아 움직인다 (F-04, confirmed/home.html:2684)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("시간이 흐르면 카운트다운 표시가 갱신된다", () => {
    vi.useFakeTimers();
    render(<HomeView {...HOME_BASIC} />);

    expect(screen.getByText("1:18:59")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText("1:18:59")).toBeNull();
    expect(screen.getByText("1:18:58")).toBeInTheDocument();
  });
});

describe("HomeView — 오프라인이면 출근 인증 버튼이 비활성화된다 (F-02, confirmed/home.html:2646-2651)", () => {
  afterEach(() => {
    setNavigatorOnLine(true);
  });

  it("연결이 끊기면 버튼이 비활성화되고 라벨이 안내 문구로 바뀐다", () => {
    setNavigatorOnLine(false);
    render(<HomeView {...HOME_WINDOW_OPEN} />);

    expect(screen.getByRole("button", { name: "연결되면 인증할 수 있어요" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "퇴근 인증하기" })).toBeNull();
  });

  it("연결이 살아 있으면 인증 창이 열린 동안 버튼이 활성 상태로 원래 라벨을 보여준다", () => {
    setNavigatorOnLine(true);
    render(<HomeView {...HOME_WINDOW_OPEN} />);

    expect(screen.getByRole("button", { name: "퇴근 인증하기" })).toBeEnabled();
  });
});
