import { describe, expect, it } from "vitest";

import {
  CONFIRMED_ROSTER_GENERAL,
  CONFIRMED_ROSTER_UNASSIGNED,
  CONFIRMED_ROSTER_WITH_TRAINEE,
} from "@/entities/schedule/model/confirmed-roster.mock";

describe("confirmed roster mock", () => {
  it("일반 확정은 본인 행 하나를 갖고 교육생이 없다", () => {
    expect(CONFIRMED_ROSTER_GENERAL.roster.filter((row) => row.isSelf)).toHaveLength(1);
    expect(CONFIRMED_ROSTER_GENERAL.roster.some((row) => row.isTrainee)).toBe(false);
  });

  it("본인 행의 이름은 화면 표시 텍스트('나')가 아니라 실제 이름이다", () => {
    const me = CONFIRMED_ROSTER_GENERAL.roster.find((row) => row.isSelf);
    expect(me?.name).not.toBe("나");
  });

  it("교육생 포함 시나리오는 일반 확정 위에 교육생 행을 더한다", () => {
    expect(CONFIRMED_ROSTER_WITH_TRAINEE.roster.some((row) => row.isTrainee)).toBe(true);
    expect(CONFIRMED_ROSTER_WITH_TRAINEE.roster.filter((row) => row.isSelf)).toHaveLength(1);
  });

  it("미배정 시나리오는 본인 행이 없다", () => {
    expect(CONFIRMED_ROSTER_UNASSIGNED.roster.some((row) => row.isSelf)).toBe(false);
  });
});
