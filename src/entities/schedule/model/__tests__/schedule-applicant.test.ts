import { describe, expect, it } from "vitest";

import type { ScheduleApplicant } from "@/entities/schedule/model/schedule-applicant";

describe("ScheduleApplicant", () => {
  it("이름 문자열만 갖는다", () => {
    const applicant: ScheduleApplicant = { name: "김민준" };

    expect(Object.keys(applicant)).toEqual(["name"]);
  });
});
