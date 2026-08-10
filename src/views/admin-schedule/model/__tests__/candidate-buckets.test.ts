import { describe, expect, it } from "vitest";

import type { AssignmentCandidate } from "@/entities/assignment/types/candidate";
import { groupAssignmentCandidates } from "@/views/admin-schedule/model/candidate-buckets";

function candidate(overrides: Partial<AssignmentCandidate>): AssignmentCandidate {
  return {
    profileId: "profile-1",
    name: "김근무",
    applied: false,
    currentlyAssigned: false,
    otherPositionNames: [],
    eligible: true,
    ineligibleReason: null,
    ...overrides,
  };
}

describe("groupAssignmentCandidates", () => {
  it("신청함·신청 안 함·미달 세 묶음으로 분류한다", () => {
    const applied = candidate({ profileId: "p1", applied: true, eligible: true });
    const notApplied = candidate({ profileId: "p2", applied: false, eligible: true });
    const ineligible = candidate({
      profileId: "p3",
      applied: true,
      eligible: false,
      ineligibleReason: "GENDER_MISMATCH",
    });

    const result = groupAssignmentCandidates([applied, notApplied, ineligible]);

    expect(result).toEqual({
      applied: [applied],
      notApplied: [notApplied],
      ineligible: [ineligible],
    });
  });

  it("미달자는 신청 여부와 무관하게 미달 묶음에만 들어간다", () => {
    const ineligibleNotApplied = candidate({
      profileId: "p1",
      applied: false,
      eligible: false,
      ineligibleReason: "NOT_ELIGIBLE",
    });

    const result = groupAssignmentCandidates([ineligibleNotApplied]);

    expect(result.applied).toEqual([]);
    expect(result.notApplied).toEqual([]);
    expect(result.ineligible).toEqual([ineligibleNotApplied]);
  });

  it("빈 목록은 세 묶음 모두 빈 배열이다", () => {
    expect(groupAssignmentCandidates([])).toEqual({
      applied: [],
      notApplied: [],
      ineligible: [],
    });
  });
});
