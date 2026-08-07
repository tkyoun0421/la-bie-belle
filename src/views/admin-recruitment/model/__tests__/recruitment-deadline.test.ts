import { describe, expect, it } from "vitest";

import { validateRecruitmentDeadline } from "@/views/admin-recruitment/model/recruitment-deadline";

const TODAY = "2099-09-15";

describe("validateRecruitmentDeadline", () => {
  it("마감일이 비어 있으면 입력을 요구하는 오류를 반환한다", () => {
    const result = validateRecruitmentDeadline({
      deadline: "",
      selectedDates: new Set(["2099-09-20"]),
      today: TODAY,
    });

    expect(result).not.toBeNull();
  });

  it("마감일이 오늘보다 이르면 오류를 반환한다", () => {
    const result = validateRecruitmentDeadline({
      deadline: "2099-09-14",
      selectedDates: new Set(["2099-09-20"]),
      today: TODAY,
    });

    expect(result).not.toBeNull();
  });

  it("마감일이 오늘과 같으면 통과한다(경계 허용)", () => {
    const result = validateRecruitmentDeadline({
      deadline: TODAY,
      selectedDates: new Set(["2099-09-20"]),
      today: TODAY,
    });

    expect(result).toBeNull();
  });

  it("마감일이 가장 이른 선택 날짜보다 늦으면 오류를 반환한다", () => {
    const result = validateRecruitmentDeadline({
      deadline: "2099-09-21",
      selectedDates: new Set(["2099-09-18", "2099-09-20"]),
      today: TODAY,
    });

    expect(result).not.toBeNull();
  });

  it("마감일이 가장 이른 선택 날짜와 같으면 통과한다(경계 허용)", () => {
    const result = validateRecruitmentDeadline({
      deadline: "2099-09-18",
      selectedDates: new Set(["2099-09-18", "2099-09-20"]),
      today: TODAY,
    });

    expect(result).toBeNull();
  });

  it("오늘 이후이면서 가장 이른 선택 날짜 이전이면 통과한다", () => {
    const result = validateRecruitmentDeadline({
      deadline: "2099-09-16",
      selectedDates: new Set(["2099-09-20"]),
      today: TODAY,
    });

    expect(result).toBeNull();
  });

  it("선택된 날짜가 없으면 오늘 이후 조건만 확인한다", () => {
    const result = validateRecruitmentDeadline({
      deadline: "2099-09-16",
      selectedDates: new Set(),
      today: TODAY,
    });

    expect(result).toBeNull();
  });
});
