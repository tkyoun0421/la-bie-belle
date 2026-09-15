import { describe, expect, it } from "vitest";
import { createSignedInUser } from "@tests/integration/supabase";

describe("profiles 표에 직접 쓰지 못한다", () => {
  it("본인이 자기 display_name을 직접 못 고친다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client
      .from("profiles")
      .update({ display_name: "윤태관" })
      .eq("id", user.profileId);

    expect(error?.code).toBe("42501");
  });

  it("본인이 자기 approved_at을 못 찍는다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client
      .from("profiles")
      .update({ approved_at: new Date().toISOString() })
      .eq("id", user.profileId);

    expect(error?.code).toBe("42501");
  });

  it("본인이 자기 행을 못 지운다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client
      .from("profiles")
      .delete()
      .eq("id", user.profileId);

    expect(error?.code).toBe("42501");
  });

  it("남의 photo_url을 못 고친다", async () => {
    const writer = await createSignedInUser();
    const other = await createSignedInUser();

    const { error } = await writer.client
      .from("profiles")
      .update({ photo_url: "https://example.com/photo.png" })
      .eq("id", other.profileId);

    expect(error?.code).toBe("42501");
  });
});
