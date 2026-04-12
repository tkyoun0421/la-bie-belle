import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventListItem } from "#/entities/events/models/schemas/event";
import { useDashboardCalendarState } from "#/screens/dashboard/_hooks/useDashboardCalendarState";

const mockedEventsQuery = {
  data: [] as EventListItem[],
  error: null as unknown,
};

const applyMutation = {
  error: null as unknown,
  isPending: false,
  mutateAsync: vi.fn(),
  variables: undefined as { eventId: string } | undefined,
};

const cancelMutation = {
  error: null as unknown,
  isPending: false,
  mutateAsync: vi.fn(),
  variables: undefined as { eventId: string } | undefined,
};

vi.mock("#/queries/events/hooks/useEventsQuery", () => ({
  useEventsQuery: () => mockedEventsQuery,
}));

vi.mock("#/mutations/applications/hooks/useApplyToEventMutation", () => ({
  useApplyToEventMutation: () => applyMutation,
}));

vi.mock("#/mutations/applications/hooks/useCancelEventApplicationMutation", () => ({
  useCancelEventApplicationMutation: () => cancelMutation,
}));

describe("useDashboardCalendarState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedEventsQuery.data = [];
    mockedEventsQuery.error = null;
    applyMutation.error = null;
    applyMutation.isPending = false;
    applyMutation.variables = undefined;
    applyMutation.mutateAsync.mockResolvedValue(undefined);
    cancelMutation.error = null;
    cancelMutation.isPending = false;
    cancelMutation.variables = undefined;
    cancelMutation.mutateAsync.mockResolvedValue(undefined);
  });

  it("starts empty and only keeps selectable open dates in multi selection", () => {
    mockedEventsQuery.data = [
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
      {
        eventDate: "2026-04-22",
        firstServiceAt: "12:00",
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        status: "completed",
        timeLabel: "12:00 - 18:00",
        title: "4월 22일 완료 행사",
        viewerApplicationStatus: "applied",
      },
    ];

    const { result } = renderHook(() => useDashboardCalendarState());

    expect(result.current.selectedDates).toEqual([]);
    expect(result.current.selectableDates).toEqual([
      "2026-04-20",
      "2026-04-21",
    ]);

    act(() => {
      result.current.selectDates([
        "2026-04-21",
        "2026-04-22",
        "2026-04-20",
        "2026-04-21",
      ]);
    });

    expect(result.current.selectedDates).toEqual([
      "2026-04-20",
      "2026-04-21",
    ]);
    expect(result.current.selectedEvents.map((event) => event.id)).toEqual([
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    ]);
  });

  it("runs bulk apply and cancel only for writable events in selected dates", async () => {
    mockedEventsQuery.data = [
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
        eventDate: "2026-04-20",
        firstServiceAt: "11:00",
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        status: "recruiting",
        timeLabel: "11:00 - 17:00",
        title: "4월 20일 연회 행사",
        viewerApplicationStatus: "applied",
      },
      {
        eventDate: "2026-04-21",
        firstServiceAt: "12:00",
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        status: "completed",
        timeLabel: "12:00 - 18:00",
        title: "4월 21일 완료 행사",
        viewerApplicationStatus: "applied",
      },
    ];

    const { result } = renderHook(() => useDashboardCalendarState());

    act(() => {
      result.current.selectDates(["2026-04-20", "2026-04-21"]);
    });

    await act(async () => {
      await result.current.applyToSelectedDates();
    });

    expect(applyMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(applyMutation.mutateAsync).toHaveBeenCalledWith({
      eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });

    await act(async () => {
      await result.current.cancelSelectedDateApplications();
    });

    expect(cancelMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(cancelMutation.mutateAsync).toHaveBeenCalledWith({
      eventId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });
  });
});
