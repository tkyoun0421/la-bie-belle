import { describe, expect, it } from "vitest";
import {
  createApprovedUser,
  createBlockedUser,
} from "@tests/integration/postgres";
import {
  createGuestClient,
  createSignedInUser,
} from "@tests/integration/supabase";

describe("profiles 읽기 권한", () => {
  it("승인 전에도 본인은 자기 프로필을 읽는다", async () => {
    const user = await createSignedInUser();

    const { data, error } = await user.client
      .from("profiles")
      .select("id")
      .eq("id", user.profileId);

    expect(error).toBeNull();
    expect(data).toEqual([{ id: user.profileId }]);
  });

  it("승인 전에는 남의 프로필을 한 행도 못 읽는다", async () => {
    const reader = await createSignedInUser();
    const other = await createSignedInUser();

    const { data, error } = await reader.client
      .from("profiles")
      .select("id")
      .eq("id", other.profileId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("승인되면 남의 프로필도 읽는다", async () => {
    const reader = await createApprovedUser();
    const other = await createSignedInUser();

    const { data, error } = await reader.client
      .from("profiles")
      .select("id")
      .eq("id", other.profileId);

    expect(error).toBeNull();
    expect(data).toEqual([{ id: other.profileId }]);
  });

  it("차단되면 남의 프로필을 다시 못 읽는다", async () => {
    const reader = await createBlockedUser();
    const other = await createSignedInUser();

    const { data, error } = await reader.client
      .from("profiles")
      .select("id")
      .eq("id", other.profileId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("로그아웃 상태로는 프로필을 한 행도 못 읽는다", async () => {
    const user = await createSignedInUser();
    const guest = createGuestClient();

    const { data, error } = await guest
      .from("profiles")
      .select("id")
      .eq("id", user.profileId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
