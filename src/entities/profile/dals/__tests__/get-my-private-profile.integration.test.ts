import { describe, expect, it } from "vitest";
import { getMyPrivateProfile } from "@/entities/profile/dals/get-my-private-profile";
import { createSignedInUser } from "@tests/integration/supabase";

describe("getMyPrivateProfile", () => {
  it("제출한 사용자가 자기 행을 읽으면 phone·birth_date·gender가 넘긴 값과 같다", async () => {
    const user = await createSignedInUser();
    await user.client.rpc("submit_profile", {
      display_name: "다희",
      phone: "010-0000-0021",
      birth_date: "1993-04-21",
      gender: "female",
    });

    const row = await getMyPrivateProfile(user.client, user.profileId);

    expect(row).toEqual({
      phone: "010-0000-0021",
      birth_date: "1993-04-21",
      gender: "female",
    });
  });

  it("제출하지 않은 사용자는 null이다", async () => {
    const user = await createSignedInUser();

    const row = await getMyPrivateProfile(user.client, user.profileId);

    expect(row).toBeNull();
  });

  it("남의 profileId로 읽으면 RLS에 걸려 null이다", async () => {
    const owner = await createSignedInUser();
    await owner.client.rpc("submit_profile", {
      display_name: "다희",
      phone: "010-0000-0022",
      birth_date: "1993-04-21",
      gender: "female",
    });
    const reader = await createSignedInUser();

    const row = await getMyPrivateProfile(reader.client, owner.profileId);

    expect(row).toBeNull();
  });
});
