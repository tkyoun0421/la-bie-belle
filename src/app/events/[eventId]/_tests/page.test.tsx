import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockedCreateSupabaseServerClient,
  mockedEventDetailScreen,
  mockedGetCurrentAppActor,
  mockedNotFound,
  mockedReadEventDetailWithApplicationStatus,
} = vi.hoisted(() => ({
  mockedCreateSupabaseServerClient: vi.fn(),
  mockedEventDetailScreen: vi.fn(({ event }: { event: { title: string } }) => (
    <div>{event.title}</div>
  )),
  mockedGetCurrentAppActor: vi.fn(),
  mockedNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockedReadEventDetailWithApplicationStatus: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mockedNotFound,
}));

vi.mock("#/queries/events/services/readEventDetailWithApplicationStatus", () => ({
  readEventDetailWithApplicationStatus:
    mockedReadEventDetailWithApplicationStatus,
}));

vi.mock("#/screens/events/detail/EventDetailScreen", () => ({
  EventDetailScreen: mockedEventDetailScreen,
}));

vi.mock("#/shared/lib/auth/appActor", () => ({
  getCurrentAppActor: mockedGetCurrentAppActor,
}));

vi.mock("#/shared/lib/supabase/server", () => ({
  createSupabaseServerClient: mockedCreateSupabaseServerClient,
}));

import EventDetailPage from "#/app/events/[eventId]/page";

describe("EventDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the event through the server client and renders the detail screen", async () => {
    const client = { auth: {} };

    mockedCreateSupabaseServerClient.mockResolvedValue(client);
    mockedGetCurrentAppActor.mockResolvedValue({
      email: "member1@labiebelle.local",
      kind: "development_member",
      name: "팀원1",
      role: "member",
      source: "development_seed",
      userId: "33333333-3333-4333-8333-333333333333",
    });
    mockedReadEventDetailWithApplicationStatus.mockResolvedValue({
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
      viewerApplicationStatus: null,
    });

    const result = await EventDetailPage({
      params: Promise.resolve({
        eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
    });

    render(result);

    expect(mockedCreateSupabaseServerClient).toHaveBeenCalledTimes(1);
    expect(mockedGetCurrentAppActor).toHaveBeenCalledWith({ client });
    expect(mockedReadEventDetailWithApplicationStatus).toHaveBeenCalledWith({
      client,
      eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      viewerId: "33333333-3333-4333-8333-333333333333",
    });
    expect(screen.getByText("4월 20일 주말 웨딩")).toBeInTheDocument();
  });

  it("routes missing events to notFound", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue({ auth: {} });
    mockedGetCurrentAppActor.mockResolvedValue(null);
    mockedReadEventDetailWithApplicationStatus.mockResolvedValue(null);

    await expect(
      EventDetailPage({
        params: Promise.resolve({
          eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockedNotFound).toHaveBeenCalledTimes(1);
  });
});
