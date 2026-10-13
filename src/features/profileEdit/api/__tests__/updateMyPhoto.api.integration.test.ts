import { updateMyPhoto } from "@/features/profileEdit/api/updateMyPhoto.api";
import { createAdminUser } from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

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

describe("updateMyPhoto — 내 사진 주소를 바꾸는 호출을 보낸다", () => {
  it("본인의 photo_url이 바뀐다", async () => {
    const user = await createSignedInUser();

    await expect(
      updateMyPhoto(user.client, "https://example.com/c.png"),
    ).resolves.toBeUndefined();

    const { data } = await user.client
      .from("profiles")
      .select("photo_url")
      .eq("id", user.profileId)
      .single<{ photo_url: string | null }>();

    expect(data?.photo_url).toBe("https://example.com/c.png");
  });
});
