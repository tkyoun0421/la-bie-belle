import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode, Ref } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CountdownState } from "@/views/home/model/countdown";
import type { TodayShift } from "@/views/home/model/home-view-model";
import { TodayBlock } from "@/views/home/ui/TodayBlock";

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

const SHIFT: TodayShift = {
  date: "2026-08-18",
  position: "홀서빙",
  startTime: "11:00",
  endTime: "16:00",
  headcount: 4,
  ceremonyTime: "14:00",
  attendanceWindow: { action: "check-in", scheduledAt: "2026-08-18T11:00:00+09:00" },
};

const COUNTDOWN: CountdownState = { phase: "open", remainingSeconds: 3600 };

describe("TodayBlock — 오늘 메타 눌림 스쿼시 (인수 조건 39, 라운드 38 #8, home.html:577-593)", () => {
  it("포지션 보기 행에 .985 배율의 눌림 피드백을 토큰 시간·이징으로 걸고 인라인 ms를 박지 않는다", () => {
    render(
      <TodayBlock
        status="filled"
        shift={SHIFT}
        todayLabel="8월 18일 화요일"
        countdown={COUNTDOWN}
        windowOpensAtLabel={null}
      />,
    );

    const metaLink = screen.getByText(/포지션 보기/).closest("a");
    expect(metaLink).not.toBeNull();
    expect(metaLink?.className).toContain("active:scale-[0.985]");
    expect(metaLink?.className).toContain("duration-[var(--duration-feedback)]");
    expect(metaLink?.className).toContain("ease-[var(--ease-out)]");
    expect(metaLink?.getAttribute("style") ?? "").not.toMatch(/\d+m?s/);
  });
});
