import { describe, expect, it } from "vitest";
import { appInfo } from "../src/shared/config/appInfo";

describe("appInfo", () => {
  it("exposes the baseline app name", () => {
    expect(appInfo.name).toBe("La Bie Belle");
  });
});
