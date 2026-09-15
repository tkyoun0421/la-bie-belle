import { describe, expect, it } from "vitest";
import { isDomainError } from "@/shared/api/errors";
import { updateMyPhoto } from "@/entities/profile/dals/update-my-photo";
import { createAdminUser } from "@tests/integration/postgres";
import {
  createGuestClient,
  createSignedInUser,
} from "@tests/integration/supabase";

describe("update_my_photo", () => {
  it("본인이 부르면 자기 photo_url이 바뀐다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client.rpc("update_my_photo", {
      photo_url: "https://example.com/a.png",
    });
    expect(error).toBeNull();

    const { data } = await user.client
      .from("profiles")
      .select("photo_url")
      .eq("id", user.profileId)
      .single<{ photo_url: string | null }>();

    expect(data?.photo_url).toBe("https://example.com/a.png");
  });

  it("남의 프로필은 관리자가 불러도 바뀌지 않는다", async () => {
    const other = await createSignedInUser();
    const admin = await createAdminUser();

    const { error } = await admin.client.rpc("update_my_photo", {
      photo_url: "https://example.com/b.png",
    });
    expect(error).toBeNull();

    const { data } = await admin.client
      .from("profiles")
      .select("photo_url")
      .eq("id", other.profileId)
      .single<{ photo_url: string | null }>();

    expect(data?.photo_url).toBeNull();
  });
});

describe("updateMyPhoto dal", () => {
  it("본인이 부르면 자기 photo_url이 새 값으로 바뀐다", async () => {
    const user = await createSignedInUser();

    await updateMyPhoto(user.client, "https://example.com/dal.png");

    const { data } = await user.client
      .from("profiles")
      .select("photo_url")
      .eq("id", user.profileId)
      .single<{ photo_url: string | null }>();

    expect(data?.photo_url).toBe("https://example.com/dal.png");
  });

  it("로그아웃 상태로 부르면 DomainError(not_allowed)로 reject된다", async () => {
    const guest = createGuestClient();

    let caught: unknown;
    try {
      await updateMyPhoto(guest, "https://example.com/dal.png");
    } catch (e) {
      caught = e;
    }

    expect(isDomainError(caught, "not_allowed")).toBe(true);
  });
});
