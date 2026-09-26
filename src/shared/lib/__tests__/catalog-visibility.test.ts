import { isCatalogVisible } from "@/shared/lib/catalog-visibility";

describe("isCatalogVisible — /_catalog는 개발 빌드에서만 선다 (AC-02)", () => {
  it("__DEV__가 참이면 카탈로그를 노출한다", () => {
    expect(isCatalogVisible(true)).toBe(true);
  });

  it("__DEV__가 거짓이면 카탈로그를 노출하지 않는다 — 프로덕션은 /로 돌아간다", () => {
    expect(isCatalogVisible(false)).toBe(false);
  });
});
