import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryClient } from "#/shared/lib/tanstack-query/createQueryClient";

const {
  mockedCreateSupabaseServerClient,
  mockedGetCurrentAppActor,
  mockedDashboardScreen,
  mockedHasPublicSupabaseEnv,
  mockedReadEventCollectionWithApplicationStatus,
} = vi.hoisted(() => ({
  mockedCreateSupabaseServerClient: vi.fn(),
  mockedGetCurrentAppActor: vi.fn(),
  mockedDashboardScreen: vi.fn(() => <div>dashboard</div>),
  mockedHasPublicSupabaseEnv: vi.fn(() => true),
  mockedReadEventCollectionWithApplicationStatus: vi.fn(),
}));

vi.mock("#/shared/config/env", () => ({
  hasPublicSupabaseEnv: mockedHasPublicSupabaseEnv,
}));

vi.mock("#/queries/events/services/readEventCollectionWithApplicationStatus", () => ({
  readEventCollectionWithApplicationStatus:
    mockedReadEventCollectionWithApplicationStatus,
}));

vi.mock("#/screens/dashboard/DashboardScreen", () => ({
  DashboardScreen: mockedDashboardScreen,
}));

vi.mock("#/shared/lib/auth/appActor", () => ({
  getCurrentAppActor: mockedGetCurrentAppActor,
}));

vi.mock("#/shared/lib/supabase/server", () => ({
  createSupabaseServerClient: mockedCreateSupabaseServerClient,
}));

import RootPage from "#/app/page";

describe("RootPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedHasPublicSupabaseEnv.mockReturnValue(true);
  });

  it("reads events through the server client and renders the dashboard", async () => {
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
    mockedReadEventCollectionWithApplicationStatus.mockResolvedValue([]);

    const result = await RootPage();
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>{result}</QueryClientProvider>
    );

    expect(mockedCreateSupabaseServerClient).toHaveBeenCalledTimes(1);
    expect(mockedGetCurrentAppActor).toHaveBeenCalledWith({ client });
    expect(mockedReadEventCollectionWithApplicationStatus).toHaveBeenCalledWith({
      client,
      viewerId: "33333333-3333-4333-8333-333333333333",
    });
    expect(screen.getByText("dashboard")).toBeInTheDocument();
  });

  it("renders the dashboard with an empty hydration seed when Supabase env is missing", async () => {
    mockedHasPublicSupabaseEnv.mockReturnValue(false);

    const result = await RootPage();
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>{result}</QueryClientProvider>
    );

    expect(mockedCreateSupabaseServerClient).not.toHaveBeenCalled();
    expect(mockedGetCurrentAppActor).not.toHaveBeenCalled();
    expect(
      mockedReadEventCollectionWithApplicationStatus
    ).not.toHaveBeenCalled();
    expect(screen.getByText("dashboard")).toBeInTheDocument();
  });
});
