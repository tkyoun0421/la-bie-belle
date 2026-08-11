import { describe, expect, it } from "vitest";

import { resolveRouteTransition } from "@/shared/model/route-transition";

describe("resolveRouteTransition", () => {
  it("탭 경로끼리 이동하면 tab을 돌려준다", () => {
    expect(resolveRouteTransition("/", "/schedule")).toBe("tab");
  });

  it("탭 경로에서 탭 밖 경로로 나가면 nav-forward를 돌려준다", () => {
    expect(resolveRouteTransition("/schedule", "/schedule/2026-08-20")).toBe("nav-forward");
  });

  it("탭 밖 경로에서 탭 경로로 돌아오면 nav-back을 돌려준다", () => {
    expect(resolveRouteTransition("/schedule/2026-08-20", "/")).toBe("nav-back");
  });

  it("탭 밖 경로끼리 이동하면 null을 돌려준다", () => {
    expect(resolveRouteTransition("/schedule/2026-08-20", "/pay")).toBeNull();
  });

  it("/pay는 (tabs) 그룹 안에 있어도 탭 목록에 없으므로 탭 밖 경로로 취급한다", () => {
    expect(resolveRouteTransition("/more", "/pay")).toBe("nav-forward");
  });
});
