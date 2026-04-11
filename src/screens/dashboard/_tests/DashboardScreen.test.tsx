import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { eventQueryKeys } from "#/queries/events/constants/eventQueryKeys";
import { DashboardScreen } from "#/screens/dashboard/DashboardScreen";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

function renderDashboard(
  events: Array<{
    eventDate: string;
    firstServiceAt: string;
    id: string;
    status: "draft" | "recruiting";
    timeLabel: string;
    title: string;
    viewerApplicationStatus?: "applied" | "cancelled" | null;
  }>
) {
  const queryClient = createQueryClient();

  queryClient.setQueryData(eventQueryKeys.collection(), events);

  render(
    <QueryClientProvider client={queryClient}>
      <DashboardScreen />
    </QueryClientProvider>
  );
}

describe("DashboardScreen", () => {
  it("renders the calendar entry point for open-date multi selection", () => {
    renderDashboard([
      {
        eventDate: "2026-04-20",
        firstServiceAt: "10:30",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        status: "draft",
        timeLabel: "10:30 - 16:00",
        title: "4월 20일 주말 웨딩",
        viewerApplicationStatus: null,
      },
      {
        eventDate: "2026-04-21",
        firstServiceAt: "11:00",
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        status: "recruiting",
        timeLabel: "11:00 - 17:00",
        title: "4월 21일 연회 행사",
        viewerApplicationStatus: "applied",
      },
    ]);

    expect(screen.getByText("행사 달력")).toBeInTheDocument();
    expect(screen.getByText("열린 날짜를 선택해 주세요")).toBeInTheDocument();
    expect(screen.getByText("배경 강조: 열린 스케줄 있음")).toBeInTheDocument();
    expect(
      screen.getByText("신청할 열린 날짜를 달력에서 선택해 주세요.")
    ).toBeInTheDocument();
  });

  it("renders a meaningful empty state when no events exist", () => {
    renderDashboard([]);

    expect(screen.getByText("아직 등록된 행사가 없습니다.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "템플릿에서 첫 행사 만들기" })
    ).toHaveAttribute("href", "/admin/templates");
  });
});
