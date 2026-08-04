import { describe, expect, it } from "vitest";

import { resolveLocation, toSourceRelative } from "../resolve-path.mjs";

const CWD = "/repo";

describe("toSourceRelative", () => {
  it("src 밖의 경로는 null이다", () => {
    expect(toSourceRelative("/repo/tools/thing.mjs", CWD)).toBeNull();
    expect(toSourceRelative("/repo/harness/lib/gate.ts", CWD)).toBeNull();
  });

  it("src 안의 경로는 저장소 기준 상대 경로다", () => {
    expect(toSourceRelative("/repo/src/shared/lib/date.ts", CWD)).toBe("src/shared/lib/date.ts");
  });
});

describe("resolveLocation", () => {
  it("app 계층은 슬라이스와 세그먼트를 갖지 않는다", () => {
    expect(resolveLocation("/repo/src/app/page.tsx", CWD)).toEqual({
      relative: "src/app/page.tsx",
      layer: "app",
      slice: null,
      segment: null,
      file: "page.tsx",
    });
  });

  it("중첩된 app 라우트도 세그먼트로 해석하지 않는다", () => {
    expect(resolveLocation("/repo/src/app/shift/[id]/page.tsx", CWD)).toMatchObject({
      layer: "app",
      slice: null,
      segment: null,
      file: "page.tsx",
    });
  });

  it("shared 계층은 슬라이스 없이 세그먼트를 갖는다", () => {
    expect(resolveLocation("/repo/src/shared/lib/date.ts", CWD)).toEqual({
      relative: "src/shared/lib/date.ts",
      layer: "shared",
      slice: null,
      segment: "lib",
      file: "date.ts",
    });
  });

  it("일반 계층은 슬라이스와 세그먼트를 모두 갖는다", () => {
    expect(resolveLocation("/repo/src/views/shift-request/ui/ShiftCard.tsx", CWD)).toEqual({
      relative: "src/views/shift-request/ui/ShiftCard.tsx",
      layer: "views",
      slice: "shift-request",
      segment: "ui",
      file: "ShiftCard.tsx",
    });
  });

  it("세그먼트 아래 하위 디렉터리가 있어도 세그먼트는 첫 단계다", () => {
    expect(resolveLocation("/repo/src/shared/api/generated/database.types.ts", CWD)).toMatchObject({
      layer: "shared",
      segment: "api",
      file: "database.types.ts",
    });
  });

  it("슬라이스 바로 아래 파일은 세그먼트가 없다", () => {
    expect(resolveLocation("/repo/src/entities/shift/model.ts", CWD)).toMatchObject({
      layer: "entities",
      slice: "shift",
      segment: null,
      file: "model.ts",
    });
  });

  it("src 밖의 파일은 null이다", () => {
    expect(resolveLocation("/repo/tools/eslint-plugin-project/index.mjs", CWD)).toBeNull();
  });
});
