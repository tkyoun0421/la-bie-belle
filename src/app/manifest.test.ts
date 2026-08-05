import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("manifest", () => {
  it("브랜드 이름과 색을 담는다", () => {
    const result = manifest();
    expect(result.name).toBe("라비에벨");
    expect(result.theme_color).toBe("#0052ff");
    expect(result.background_color).toBe("#ffffff");
  });

  it("192·512 아이콘을 선언한다", () => {
    const result = manifest();
    const sizes = result.icons?.map((icon) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });
});
