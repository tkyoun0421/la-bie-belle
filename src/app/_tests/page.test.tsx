import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockedCreateSupabaseServerClient,
  mockedDashboardScreen,
  mockedReadEvents,
} = vi.hoisted(() => ({
  mockedCreateSupabaseServerClient: vi.fn(),
  mockedDashboardScreen: vi.fn(({ events }: { events: Array<{ title: string }> }) => (
    <div>{events.map((event) => event.title).join(", ")}</div>
  )),
  mockedReadEvents: vi.fn(),
}));

vi.mock("#/entities/events/repositories/readEventRepository", () => ({
  readEvents: mockedReadEvents,
}));

vi.mock("#/screens/dashboard/DashboardScreen", () => ({
  DashboardScreen: mockedDashboardScreen,
}));

vi.mock("#/shared/lib/supabase/server", () => ({
  createSupabaseServerClient: mockedCreateSupabaseServerClient,
}));

import RootPage from "#/app/page";

describe("RootPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads events through the server client and renders the dashboard", async () => {
    const client = { auth: {} };

    mockedCreateSupabaseServerClient.mockResolvedValue(client);
    mockedReadEvents.mockResolvedValue([
      {
        eventDate: "2026-04-20",
        firstServiceAt: "10:30",
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        status: "draft",
        timeLabel: "10:30 - 16:00",
        title: "4월 20일 주말 웨딩",
      },
    ]);

    const result = await RootPage();

    render(result);

    expect(mockedCreateSupabaseServerClient).toHaveBeenCalledTimes(1);
    expect(mockedReadEvents).toHaveBeenCalledWith({ client });
    expect(screen.getByText("4월 20일 주말 웨딩")).toBeInTheDocument();
  });
});
