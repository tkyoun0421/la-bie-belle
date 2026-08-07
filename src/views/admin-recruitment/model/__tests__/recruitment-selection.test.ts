import { describe, expect, it } from "vitest";

import {
  earliestRecruitmentDate,
  toggleRecruitmentDate,
} from "@/views/admin-recruitment/model/recruitment-selection";

describe("toggleRecruitmentDate", () => {
  it("선택되지 않은 날짜를 토글하면 추가된다", () => {
    const next = toggleRecruitmentDate(new Set(), "2099-09-01");
    expect(next.has("2099-09-01")).toBe(true);
  });

  it("이미 선택된 날짜를 토글하면 제거된다", () => {
    const next = toggleRecruitmentDate(new Set(["2099-09-01"]), "2099-09-01");
    expect(next.has("2099-09-01")).toBe(false);
  });

  it("원본 Set을 변형하지 않는다", () => {
    const original = new Set(["2099-09-01"]);
    toggleRecruitmentDate(original, "2099-09-02");
    expect(original.has("2099-09-02")).toBe(false);
  });
});

describe("earliestRecruitmentDate", () => {
  it("빈 선택은 null을 반환한다", () => {
    expect(earliestRecruitmentDate(new Set())).toBeNull();
  });

  it("가장 이른 날짜를 반환한다", () => {
    const result = earliestRecruitmentDate(new Set(["2099-09-05", "2099-09-01", "2099-09-10"]));
    expect(result).toBe("2099-09-01");
  });

  it("날짜가 하나뿐이면 그 날짜를 반환한다", () => {
    expect(earliestRecruitmentDate(new Set(["2099-09-05"]))).toBe("2099-09-05");
  });
});
