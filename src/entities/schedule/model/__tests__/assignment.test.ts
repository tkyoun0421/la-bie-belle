import { describe, expect, it } from "vitest";

import type { AssignmentRosterRow } from "@/entities/schedule/model/assignment";

describe("AssignmentRosterRow", () => {
  it("이름·담당 포지션·교육생 구분·본인 여부만 갖는다", () => {
    const row: AssignmentRosterRow = {
      name: "김민준",
      positions: ["플로어"],
      isTrainee: false,
      isMe: false,
    };

    expect(Object.keys(row).sort()).toEqual(["isMe", "isTrainee", "name", "positions"]);
  });

  it("타입 수준에서 전화번호·성별·시급·출결 필드를 정의하지 않는다", () => {
    type ForbiddenKeys = "phone" | "gender" | "hourlyWage" | "attendance";
    type Overlap = Extract<keyof AssignmentRosterRow, ForbiddenKeys>;
    const hasNoForbiddenKeys: Overlap extends never ? true : false = true;

    expect(hasNoForbiddenKeys).toBe(true);
  });
});
