import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockedCreateSupabaseServerClient,
  mockedGetCurrentAppActor,
  mockedHasPublicSupabaseEnv,
  mockedReadEventCollectionWithApplicationStatus,
} = vi.hoisted(() => ({
  mockedCreateSupabaseServerClient: vi.fn(),
  mockedGetCurrentAppActor: vi.fn(),
  mockedHasPublicSupabaseEnv: vi.fn(() => true),
  mockedReadEventCollectionWithApplicationStatus: vi.fn(),
}));

vi.mock("#/shared/config/env", () => ({
  hasPublicSupabaseEnv: mockedHasPublicSupabaseEnv,
}));

vi.mock("#/shared/lib/auth/appActor", () => ({
  getCurrentAppActor: mockedGetCurrentAppActor,
}));

vi.mock("#/shared/lib/supabase/server", () => ({
  createSupabaseServerClient: mockedCreateSupabaseServerClient,
}));

vi.mock("#/queries/events/services/readEventCollectionWithApplicationStatus", () => ({
  readEventCollectionWithApplicationStatus:
    mockedReadEventCollectionWithApplicationStatus,
}));

import { GET } from "#/app/api/events/route";

describe("GET /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedHasPublicSupabaseEnv.mockReturnValue(true);
  });

  it("returns an empty event list when Supabase env is missing", async () => {
    mockedHasPublicSupabaseEnv.mockReturnValue(false);

    const response = await GET();

    await expect(response.json()).resolves.toEqual({ events: [] });
    expect(mockedCreateSupabaseServerClient).not.toHaveBeenCalled();
    expect(mockedGetCurrentAppActor).not.toHaveBeenCalled();
    expect(
      mockedReadEventCollectionWithApplicationStatus
    ).not.toHaveBeenCalled();
  });
});
