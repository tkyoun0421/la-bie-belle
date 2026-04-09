import { describe, expect, it } from "vitest";
import { logoutAction } from "#/mutations/auth/logout/actions/action";

describe("logoutAction", () => {
  it("returns a successful bootstrap response", async () => {
    await expect(logoutAction()).resolves.toEqual({ success: true });
  });
});
