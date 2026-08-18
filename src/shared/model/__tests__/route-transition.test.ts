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
    expect(
      resolveRouteTransition("/schedule/2026-08-20", "/more/notification-settings"),
    ).toBeNull();
  });

  it("/pay는 급여 탭이라 탭 경로끼리의 이동으로 취급한다", () => {
    expect(resolveRouteTransition("/more", "/pay")).toBe("tab");
  });
});
