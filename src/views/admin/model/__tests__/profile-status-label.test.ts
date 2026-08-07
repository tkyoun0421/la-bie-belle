import { describe, expect, it } from "vitest";

import { profileStatusLabel } from "@/views/admin/model/profile-status-label";

describe("profileStatusLabel", () => {
  it("각 상태를 한글 문구로 변환한다", () => {
    expect(profileStatusLabel("pending")).toBe("승인 대기");
    expect(profileStatusLabel("active")).toBe("활동 중");
    expect(profileStatusLabel("rejected")).toBe("거절됨");
    expect(profileStatusLabel("dormant")).toBe("휴면");
    expect(profileStatusLabel("departed")).toBe("퇴사");
  });
});
