import { describe, expect, it } from "vitest";

import {
  formatRevisedAt,
  shouldShowRevisionNotice,
} from "@/views/schedule-detail/model/revision-notice";

describe("shouldShowRevisionNotice", () => {
  it("revision이 1이면 변경 표시를 하지 않는다", () => {
    expect(shouldShowRevisionNotice(1)).toBe(false);
  });

  it("revision이 1보다 크면 변경 표시를 한다", () => {
    expect(shouldShowRevisionNotice(2)).toBe(true);
  });
});

describe("formatRevisedAt", () => {
  it("ISO 시각을 M월 d일 HH:mm 형식으로 바꾼다", () => {
    expect(formatRevisedAt("2026-08-15T01:23:00.000000+00:00")).toMatch(
      /^\d{1,2}월 \d{1,2}일 \d{2}:\d{2}$/,
    );
  });
});
