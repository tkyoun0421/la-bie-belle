import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardScreen } from "#/screens/dashboard/DashboardScreen";

describe("DashboardScreen", () => {
  it("renders the event list entry point with detail links", () => {
    render(
      <DashboardScreen
        events={[
          {
            eventDate: "2026-04-20",
            firstServiceAt: "10:30",
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            status: "draft",
            timeLabel: "10:30 - 16:00",
            title: "4월 20일 주말 웨딩",
          },
          {
            eventDate: "2026-04-21",
            firstServiceAt: "11:00",
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            status: "recruiting",
            timeLabel: "11:00 - 17:00",
            title: "4월 21일 연회 행사",
          },
        ]}
      />
    );

    expect(screen.getByText("행사 목록")).toBeInTheDocument();
    expect(screen.getByText("4월 20일 주말 웨딩")).toBeInTheDocument();
    expect(screen.getByText("4월 21일 연회 행사")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "상세 보기" })[0]).toHaveAttribute(
      "href",
      "/events/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    );
  });

  it("renders a meaningful empty state when no events exist", () => {
    render(<DashboardScreen events={[]} />);

    expect(screen.getByText("아직 등록된 행사가 없습니다.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "템플릿에서 첫 행사 만들기" })
    ).toHaveAttribute("href", "/admin/templates");
  });
});
