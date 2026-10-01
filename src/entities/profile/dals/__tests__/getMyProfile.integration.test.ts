import { getMyProfile } from "@/entities/profile/dals/get-my-profile";
import {
  createSignedInUser,
  createSignedInUserWithoutProfile,
} from "@tests/integration/supabase";

describe("자기 프로필 행을 읽는다", () => {
  it("승인 전 사용자가 자기 행을 읽으면 아홉 열이 전부 든 객체를 받는다", async () => {
    const user = await createSignedInUser();

    const profile = await getMyProfile(user.client, user.userId);

    expect(profile).toMatchObject({
      id: user.profileId,
      display_name: null,
      photo_url: null,
      role: "member",
      submitted_at: null,
      approved_at: null,
      rejected_at: null,
      blocked_at: null,
      left_at: null,
    });
  });

  it("프로필 행이 없으면 null이다", async () => {
    const user = await createSignedInUserWithoutProfile();

    const profile = await getMyProfile(user.client, user.userId);

    expect(profile).toBeNull();
  });

  it("남의 행이 섞이지 않고 자기 프로필만 읽힌다", async () => {
    const me = await createSignedInUser();
    const other = await createSignedInUser();

    const profile = await getMyProfile(me.client, me.userId);

    expect(profile?.id).toBe(me.profileId);
    expect(profile?.id).not.toBe(other.profileId);
  });
});
