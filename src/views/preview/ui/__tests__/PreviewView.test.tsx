import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PreviewView, type PreviewScreen } from "@/views/preview/ui/PreviewView";

afterEach(cleanup);

const SCREENS: PreviewScreen[] = [
  {
    label: "홈",
    scenarios: [
      { label: "출근 가능", node: <p>홈 · 출근 가능 화면</p> },
      { label: "빈 상태", node: <p>홈 · 빈 상태 화면</p> },
    ],
  },
  {
    label: "일정",
    scenarios: [{ label: "모집 혼합 월", node: <p>일정 · 모집 혼합 월 화면</p> }],
  },
];

describe("PreviewView", () => {
  it("기본으로 첫 화면과 첫 시나리오를 렌더한다", () => {
    render(<PreviewView screens={SCREENS} />);

    expect(screen.getByText("홈 · 출근 가능 화면")).toBeInTheDocument();
  });

  it("화면을 바꾸면 해당 화면의 첫 시나리오가 렌더된다", async () => {
    const user = userEvent.setup();
    render(<PreviewView screens={SCREENS} />);

    await user.selectOptions(screen.getByLabelText("화면 선택"), "일정");

    expect(screen.getByText("일정 · 모집 혼합 월 화면")).toBeInTheDocument();
  });

  it("시나리오를 바꾸면 같은 화면의 다른 상태가 렌더된다", async () => {
    const user = userEvent.setup();
    render(<PreviewView screens={SCREENS} />);

    await user.selectOptions(screen.getByLabelText("시나리오 선택"), "빈 상태");

    expect(screen.getByText("홈 · 빈 상태 화면")).toBeInTheDocument();
  });
});
