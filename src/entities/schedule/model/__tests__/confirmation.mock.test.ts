import { describe, expect, it } from "vitest";

import {
  CONFIRMED_WITH_CHANGE,
  GENERAL_CONFIRMATION,
  TRAINEE_CONFIRMATION,
} from "@/entities/schedule/model/confirmation.mock";

describe("confirmation mock", () => {
  it("변경이 있는 확정은 변경 요약을 갖는다", () => {
    expect(CONFIRMED_WITH_CHANGE.changeSummary).toBeTruthy();
  });

  it("변경이 없는 확정은 변경 요약이 없다", () => {
    expect(GENERAL_CONFIRMATION.changeSummary).toBeUndefined();
  });

  it("교육생이 포함된 배정표 시나리오를 제공한다", () => {
    expect(TRAINEE_CONFIRMATION.roster.some((row) => row.isTrainee)).toBe(true);
  });

  it("일반 확정은 교육생 없는 대조군 배정표를 쓴다(교육생 시나리오와 구분됨)", () => {
    expect(GENERAL_CONFIRMATION.roster.some((row) => row.isTrainee)).toBe(false);
    expect(GENERAL_CONFIRMATION.roster).not.toBe(TRAINEE_CONFIRMATION.roster);
  });
});
