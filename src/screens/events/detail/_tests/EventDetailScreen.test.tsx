import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventDetailScreen } from "#/screens/events/detail/EventDetailScreen";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

function renderEventDetail(
  event: Parameters<typeof EventDetailScreen>[0]["event"]
) {
  const queryClient = createQueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <EventDetailScreen event={event} />
    </QueryClientProvider>
  );
}

describe("EventDetailScreen", () => {
  it("renders the real event metadata and copied slots", () => {
    renderEventDetail({
      createdAt: "2026-04-11T08:00:00.000Z",
      eventDate: "2026-04-20",
      firstServiceAt: "10:30",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      lastServiceEndAt: "16:00",
      positionSlots: [
        {
          positionId: "11111111-1111-4111-8111-111111111111",
          positionName: "안내",
          requiredCount: 2,
          trainingCount: 1,
        },
      ],
      status: "draft",
      templateId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      timeLabel: "10:30 - 16:00",
      title: "4월 20일 주말 웨딩",
      viewerApplicationStatus: null,
    });

    expect(screen.getByText("4월 20일 주말 웨딩")).toBeInTheDocument();
    expect(screen.getByText("서비스 시간")).toBeInTheDocument();
    expect(screen.getAllByText("10:30 - 16:00")).toHaveLength(2);
    expect(screen.getByText("안내")).toBeInTheDocument();
    expect(screen.getByText("정규 2명")).toBeInTheDocument();
    expect(screen.getByText("교육 1명")).toBeInTheDocument();
    expect(screen.getAllByText("신청 상태")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "신청" })).toBeInTheDocument();
  });

  it("shows an empty placeholder when no copied slots exist", () => {
    renderEventDetail({
      createdAt: "2026-04-11T08:00:00.000Z",
      eventDate: "2026-04-20",
      firstServiceAt: "10:30",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      lastServiceEndAt: "16:00",
      positionSlots: [],
      status: "draft",
      templateId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      timeLabel: "10:30 - 16:00",
      title: "4월 20일 주말 웨딩",
      viewerApplicationStatus: "applied",
    });

    expect(
      screen.getByText(/이 행사에는 아직 표시할 포지션 슬롯 정보가 없습니다/)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "신청 취소" })).toBeInTheDocument();
  });
});
