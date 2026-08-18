import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useNoticeDeck, type UseNoticeDeckResult } from "@/views/home/hooks/useNoticeDeck";
import type { NoticeItem } from "@/views/home/model/home-view-model";
import { NoticeBlock } from "@/views/home/ui/NoticeBlock";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const NOTICE_A: NoticeItem = { id: "n1", kind: "vacancy", date: "2026-08-22" };
const NOTICE_B: NoticeItem = { id: "n2", kind: "schedule-confirmed", month: "2026-08" };
const NOTICE_C: NoticeItem = {
  id: "n3",
  kind: "assignment-changed",
  date: "2026-08-21",
  fromPosition: "홀서빙",
  toPosition: "접수",
};

function stubDeck(overrides: Partial<UseNoticeDeckResult>): UseNoticeDeckResult {
  return {
    currentId: NOTICE_A.id,
    leavingId: null,
    remainingCount: 2,
    phase: "idle",
    dismiss: vi.fn(),
    settle: vi.fn(),
    ...overrides,
  };
}

describe("NoticeBlock — 진입 모션 배선 (인수 조건 39, 라운드 38 #5, home.html:489-507)", () => {
  it("phase가 entering이면 현재 카드에 noticeIn 모션 클래스가 걸린다", () => {
    render(
      <NoticeBlock
        status="filled"
        notices={[NOTICE_A, NOTICE_B]}
        deck={stubDeck({ phase: "entering" })}
      />,
    );

    const card = screen.getByRole("button", { name: "알림 끄기" }).parentElement;
    expect(card).toHaveClass("motion-notice-in");
  });

  it("phase가 idle이면 진입 모션 클래스가 없다", () => {
    render(
      <NoticeBlock
        status="filled"
        notices={[NOTICE_A, NOTICE_B]}
        deck={stubDeck({ phase: "idle" })}
      />,
    );

    const card = screen.getByRole("button", { name: "알림 끄기" }).parentElement;
    expect(card).not.toHaveClass("motion-notice-in");
  });

  it("진입 애니메이션이 끝나면(animationend) settle을 부른다 — 놓치면 화면에 얼어붙는다", () => {
    const settle = vi.fn();
    render(
      <NoticeBlock
        status="filled"
        notices={[NOTICE_A, NOTICE_B]}
        deck={stubDeck({ phase: "entering", settle })}
      />,
    );

    const card = screen.getByRole("button", { name: "알림 끄기" }).parentElement as HTMLElement;
    fireEvent.animationEnd(card);

    expect(settle).toHaveBeenCalledTimes(1);
  });
});

describe("NoticeBlock — 퇴장 모션 배선 (인수 조건 39, 라운드 38 #6, home.html:493-495, 훅이 leavingId를 노출한다)", () => {
  it("leavingId가 있으면 그 카드에 noticeOut 모션 클래스가 걸리고, 현재 카드는 그대로 보인다", () => {
    const { container } = render(
      <NoticeBlock
        status="filled"
        notices={[NOTICE_A, NOTICE_B]}
        deck={stubDeck({ currentId: NOTICE_B.id, leavingId: NOTICE_A.id, phase: "entering" })}
      />,
    );

    const leavingCard = container.querySelector(".motion-notice-out");
    expect(leavingCard).not.toBeNull();
    expect(leavingCard?.textContent).toContain("8월 22일 공석");

    expect(screen.getByText("8월 스케줄 확정")).toBeInTheDocument();
  });

  it("leavingId가 없으면 퇴장 모션 클래스를 가진 카드가 없다", () => {
    const { container } = render(
      <NoticeBlock
        status="filled"
        notices={[NOTICE_A, NOTICE_B]}
        deck={stubDeck({ leavingId: null })}
      />,
    );

    expect(container.querySelector(".motion-notice-out")).toBeNull();
  });

  it("퇴장 애니메이션이 끝나면(animationend) settle을 불러 leavingId를 비운다 — 마지막 카드는 이 신호로만 슬롯이 접힌다", () => {
    const settle = vi.fn();
    const { container } = render(
      <NoticeBlock
        status="filled"
        notices={[NOTICE_A]}
        deck={stubDeck({ currentId: null, leavingId: NOTICE_A.id, remainingCount: 0, settle })}
      />,
    );

    const leavingCard = container.querySelector(".motion-notice-out") as HTMLElement;
    expect(leavingCard).not.toBeNull();
    fireEvent.animationEnd(leavingCard);

    expect(settle).toHaveBeenCalledTimes(1);
  });
});

describe("NoticeBlock — 슬롯 접힘 (인수 조건 39, 라운드 38 #4, home.html:459-467)", () => {
  it("남은 카드가 있으면 슬롯이 접히지 않는다", () => {
    render(
      <NoticeBlock
        status="filled"
        notices={[NOTICE_A]}
        deck={stubDeck({ currentId: NOTICE_A.id, leavingId: null, remainingCount: 1 })}
      />,
    );

    expect(screen.getByTestId("notice-slot")).not.toHaveClass("motion-notice-collapsed");
  });

  it("마지막 카드를 꺼도 퇴장이 끝나기 전(leavingId가 남아 있는 동안)에는 슬롯이 아직 접히지 않는다", () => {
    render(
      <NoticeBlock
        status="filled"
        notices={[NOTICE_A]}
        deck={stubDeck({ currentId: null, leavingId: NOTICE_A.id, remainingCount: 0 })}
      />,
    );

    expect(screen.getByTestId("notice-slot")).not.toHaveClass("motion-notice-collapsed");
  });

  it("퇴장이 끝나 currentId와 leavingId가 모두 없어지면 그제서야 슬롯이 접힌다", () => {
    render(
      <NoticeBlock
        status="filled"
        notices={[NOTICE_A]}
        deck={stubDeck({ currentId: null, leavingId: null, remainingCount: 0 })}
      />,
    );

    expect(screen.getByTestId("notice-slot")).toHaveClass("motion-notice-collapsed");
  });
});

describe("NoticeBlock — 알림 끄기 눌림 스쿼시 (인수 조건 39, 라운드 38 #7, home.html:534-550)", () => {
  it(".88 배율의 눌림 피드백을 토큰 시간·이징으로 걸고 인라인 ms를 박지 않는다", () => {
    render(
      <NoticeBlock
        status="filled"
        notices={[NOTICE_A]}
        deck={stubDeck({ currentId: NOTICE_A.id, remainingCount: 1 })}
      />,
    );

    const dismissButton = screen.getByRole("button", { name: "알림 끄기" });
    expect(dismissButton.className).toContain("active:scale-[0.88]");
    expect(dismissButton.className).toContain("duration-[var(--duration-feedback)]");
    expect(dismissButton.className).toContain("ease-[var(--ease-out)]");
    expect(dismissButton.getAttribute("style") ?? "").not.toMatch(/\d+m?s/);
  });
});

describe("NoticeBlock — 연타는 실제 배선을 타고도 transitioningRef가 막는다", () => {
  function Harness() {
    const deck = useNoticeDeck([NOTICE_A.id, NOTICE_B.id, NOTICE_C.id], "2026-08-18");
    return <NoticeBlock status="filled" notices={[NOTICE_A, NOTICE_B, NOTICE_C]} deck={deck} />;
  }

  it("settle 전에 두 번 연타해도 카드는 한 장만 넘어가고, 넘어간 카드는 여전히 진입 대기 상태다", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "알림 끄기" }));
    fireEvent.click(screen.getByRole("button", { name: "알림 끄기" }));

    expect(screen.getByText("8월 스케줄 확정")).toBeInTheDocument();
    expect(screen.queryByText("8월 21일 배정 변경")).not.toBeInTheDocument();
    const card = screen.getByRole("button", { name: "알림 끄기" }).parentElement;
    expect(card).toHaveClass("motion-notice-in");
  });

  it("연타 뒤에도 방금 끈 첫 카드가 퇴장 모션 클래스를 달고 화면에 남아 있다", () => {
    const { container } = render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "알림 끄기" }));
    fireEvent.click(screen.getByRole("button", { name: "알림 끄기" }));

    const leavingCard = container.querySelector(".motion-notice-out");
    expect(leavingCard).not.toBeNull();
    expect(leavingCard?.textContent).toContain("8월 22일 공석");
  });
});
