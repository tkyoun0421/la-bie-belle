import { describe, expect, it } from "vitest";
import { getMyProfile } from "#/queries/users/get-my-profile/models/services/getMyProfile";

describe("getMyProfile", () => {
  it("returns null in bootstrap state", async () => {
    await expect(getMyProfile()).resolves.toBeNull();
  });
});
