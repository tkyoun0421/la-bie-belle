import { describe, expect, it } from "vitest";

import { resolveScreenTitle } from "@/widgets/app-shell/model/screen-title";

describe("resolveScreenTitle", () => {
  it("탭 넷의 경로를 각자의 제목으로 옮긴다", () => {
    expect(resolveScreenTitle("/")).toBe("홈");
    expect(resolveScreenTitle("/schedule")).toBe("일정");
    expect(resolveScreenTitle("/pay")).toBe("예상 급여");
    expect(resolveScreenTitle("/more")).toBe("전체");
  });

  it("탭 밖에서 종으로 들어가는 화면의 제목도 안다", () => {
    expect(resolveScreenTitle("/notifications")).toBe("알림");
    expect(resolveScreenTitle("/more/notification-settings")).toBe("알림 설정");
  });

  it("모르는 경로는 앱 이름으로 대신한다", () => {
    expect(resolveScreenTitle("/never-mapped")).toBe("라비에벨");
  });
});
