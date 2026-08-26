import { describe, expect, it } from "vitest";
import {
  createGuestClient,
  createSignedInUser,
} from "@tests/integration/supabase";

describe("프로필 접근 권한", () => {
  it("가입 승인 전에도 본인은 자기 프로필을 읽는다", async () => {
    const user = await createSignedInUser();

    const { data, error } = await user.client
      .from("profiles")
      .select("id, display_name, approved_at")
      .eq("id", user.userId);

    expect(error).toBeNull();
    expect(data).toEqual([
      { id: user.userId, display_name: null, approved_at: null },
    ]);
  });

  it("남의 프로필은 한 행도 읽지 못한다", async () => {
    const reader = await createSignedInUser();
    const other = await createSignedInUser();

    const { data, error } = await reader.client
      .from("profiles")
      .select("id")
      .eq("id", other.userId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("로그아웃 상태로는 프로필을 한 행도 읽지 못한다", async () => {
    const user = await createSignedInUser();
    const guest = createGuestClient();

    const { data, error } = await guest
      .from("profiles")
      .select("id")
      .eq("id", user.userId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("본인은 자기 프로필의 이름을 채운다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client
      .from("profiles")
      .update({ display_name: "윤태관" })
      .eq("id", user.userId);

    expect(error).toBeNull();

    const { data } = await user.client
      .from("profiles")
      .select("display_name")
      .eq("id", user.userId);

    expect(data).toEqual([{ display_name: "윤태관" }]);
  });

  it("본인은 자기 프로필의 승인 시각을 찍지 못한다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client
      .from("profiles")
      .update({ approved_at: new Date().toISOString() })
      .eq("id", user.userId);

    expect(error?.code).toBe("42501");

    const { data } = await user.client
      .from("profiles")
      .select("approved_at")
      .eq("id", user.userId);

    expect(data).toEqual([{ approved_at: null }]);
  });

  it("본인은 자기 프로필을 지우지 못한다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client
      .from("profiles")
      .delete()
      .eq("id", user.userId);

    expect(error).toBeNull();

    const { data } = await user.client
      .from("profiles")
      .select("id")
      .eq("id", user.userId);

    expect(data).toEqual([{ id: user.userId }]);
  });
});
