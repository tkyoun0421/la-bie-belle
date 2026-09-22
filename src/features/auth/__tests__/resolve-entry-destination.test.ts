import { jest } from "@jest/globals";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MyProfileRow } from "@/entities/profile/dals/get-my-profile";
import { resolveEntryDestination } from "@/features/auth/resolve-entry-destination";

const fakeClient = {} as SupabaseClient;

function buildRow(overrides: Partial<MyProfileRow> = {}): MyProfileRow {
  return {
    id: "profile-1",
    display_name: "가짜 이름",
    photo_url: null,
    role: "worker",
    submitted_at: "2026-09-01T00:00:00.000Z",
    approved_at: "2026-09-01T00:00:00.000Z",
    rejected_at: null,
    blocked_at: null,
    left_at: null,
    ...overrides,
  };
}

describe("resolveEntryDestination — 세션 유무에 따라 프로필을 읽고 목적지를 정한다", () => {
  it("세션이 없으면 getMyProfile을 부르지 않고 로그인 화면으로 보낸다", async () => {
    const getMyProfile = jest.fn(async () => buildRow());
    const ensureProfile = jest.fn(async () => {});

    const destination = await resolveEntryDestination(null, {
      client: fakeClient,
      ensureProfile,
      getMyProfile,
    });

    expect(destination).toBe("/login");
    expect(getMyProfile).not.toHaveBeenCalled();
  });

  it("세션이 있으면 ensureProfile을 먼저 부르고 그다음 getMyProfile을 부른다", async () => {
    const calls: string[] = [];
    const ensureProfile = jest.fn(async () => {
      calls.push("ensureProfile");
    });
    const getMyProfile = jest.fn(async () => {
      calls.push("getMyProfile");
      return buildRow();
    });

    await resolveEntryDestination("user-1", {
      client: fakeClient,
      ensureProfile,
      getMyProfile,
    });

    expect(calls).toEqual(["ensureProfile", "getMyProfile"]);
  });

  it("세션이 있고 프로필 행이 없으면 승인 대기 화면이다", async () => {
    const destination = await resolveEntryDestination("user-1", {
      client: fakeClient,
      ensureProfile: async () => {},
      getMyProfile: async () => null,
    });

    expect(destination).toBe("/pending");
  });

  it("승인 시각이 없으면 승인 대기 화면이다", async () => {
    const destination = await resolveEntryDestination("user-1", {
      client: fakeClient,
      ensureProfile: async () => {},
      getMyProfile: async () => buildRow({ approved_at: null }),
    });

    expect(destination).toBe("/pending");
  });

  it("차단 시각이 있으면 차단 화면이다", async () => {
    const destination = await resolveEntryDestination("user-1", {
      client: fakeClient,
      ensureProfile: async () => {},
      getMyProfile: async () =>
        buildRow({ blocked_at: "2026-09-05T00:00:00.000Z" }),
    });

    expect(destination).toBe("/blocked");
  });

  it("퇴사 시각이 있으면 퇴사 화면이다", async () => {
    const destination = await resolveEntryDestination("user-1", {
      client: fakeClient,
      ensureProfile: async () => {},
      getMyProfile: async () =>
        buildRow({ left_at: "2026-09-10T00:00:00.000Z" }),
    });

    expect(destination).toBe("/left");
  });

  it("승인됐고 차단·퇴사가 없으면 홈이다", async () => {
    const destination = await resolveEntryDestination("user-1", {
      client: fakeClient,
      ensureProfile: async () => {},
      getMyProfile: async () => buildRow(),
    });

    expect(destination).toBe("/");
  });
});
