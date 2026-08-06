import { describe, expect, it } from "vitest";

import { CONFIRMED_ROSTER, NO_TRAINEE_ROSTER } from "@/entities/schedule/model/assignment.mock";

describe("assignment mock", () => {
  it("본인 행과 교육생 행을 구분해 제공한다", () => {
    expect(CONFIRMED_ROSTER.some((row) => row.isMe)).toBe(true);
    expect(CONFIRMED_ROSTER.some((row) => row.isTrainee)).toBe(true);
  });

  it("본인 행은 하나뿐이다", () => {
    expect(CONFIRMED_ROSTER.filter((row) => row.isMe)).toHaveLength(1);
  });

  it("본인 행의 이름은 화면 표시 텍스트('나')가 아니라 실제 이름이다", () => {
    const me = CONFIRMED_ROSTER.find((row) => row.isMe);
    expect(me?.name).not.toBe("나");
  });

  it("교육생 없는 대조군 배정표는 본인 행을 유지하되 교육생이 없다", () => {
    expect(NO_TRAINEE_ROSTER.some((row) => row.isMe)).toBe(true);
    expect(NO_TRAINEE_ROSTER.every((row) => !row.isTrainee)).toBe(true);
  });
});
