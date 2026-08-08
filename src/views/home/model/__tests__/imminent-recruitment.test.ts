import { describe, expect, it } from "vitest";

import {
  selectImminentRecruitment,
  type ImminentRecruitmentCandidate,
} from "@/views/home/model/imminent-recruitment";

const TODAY = "2026-08-09";

function candidate(
  workDate: string,
  applicationDeadline: string,
  applied = false,
): ImminentRecruitmentCandidate {
  return { scheduleId: `schedule-${workDate}`, workDate, applicationDeadline, applied };
}

describe("selectImminentRecruitment", () => {
  it("후보가 없으면 null을 반환한다", () => {
    expect(selectImminentRecruitment([], TODAY)).toBeNull();
  });

  it("마감일이 오늘(D+0)인 후보를 포함한다", () => {
    const result = selectImminentRecruitment([candidate("2026-08-10", TODAY)], TODAY);

    expect(result).toEqual({ date: "2026-08-10", applicationDeadline: TODAY, applied: false });
  });

  it("마감일이 D+2인 후보를 포함한다(경계값)", () => {
    const result = selectImminentRecruitment([candidate("2026-08-12", "2026-08-11")], TODAY);

    expect(result).toEqual({
      date: "2026-08-12",
      applicationDeadline: "2026-08-11",
      applied: false,
    });
  });

  it("마감일이 D+3인 후보는 제외한다(경계값)", () => {
    const result = selectImminentRecruitment([candidate("2026-08-13", "2026-08-12")], TODAY);

    expect(result).toBeNull();
  });

  it("여러 후보 중 마감일이 가장 이른 것을 선택한다", () => {
    const result = selectImminentRecruitment(
      [candidate("2026-08-11", "2026-08-10"), candidate("2026-08-10", TODAY)],
      TODAY,
    );

    expect(result?.date).toBe("2026-08-10");
  });

  it("마감일이 같으면 근무일이 빠른 후보를 선택한다(동률)", () => {
    const result = selectImminentRecruitment(
      [candidate("2026-08-12", "2026-08-10"), candidate("2026-08-11", "2026-08-10")],
      TODAY,
    );

    expect(result?.date).toBe("2026-08-11");
  });

  it("선택된 후보의 신청 상태를 그대로 전달한다", () => {
    const result = selectImminentRecruitment([candidate("2026-08-10", TODAY, true)], TODAY);

    expect(result?.applied).toBe(true);
  });

  it("월 경계를 넘어가는 today에도 D+2 기준을 정확히 계산한다", () => {
    const result = selectImminentRecruitment(
      [candidate("2026-09-02", "2026-09-02"), candidate("2026-09-03", "2026-09-03")],
      "2026-08-31",
    );

    expect(result?.date).toBe("2026-09-02");
  });
});
