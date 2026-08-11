import { describe, expect, it } from "vitest";

import type { AssignmentCandidate } from "@/entities/assignment/types/candidate";
import {
  canSelectCandidateAsTrainee,
  groupAssignmentCandidates,
} from "@/views/admin-schedule/model/candidate-buckets";

function candidate(overrides: Partial<AssignmentCandidate>): AssignmentCandidate {
  return {
    profileId: "profile-1",
    name: "김근무",
    applied: false,
    currentlyAssigned: false,
    otherPositionNames: [],
    eligible: true,
    ineligibleReason: null,
    currentlyTrainee: false,
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

  it("이미 배정된 미달자는 신청 여부에 따라 신청함/신청 안 함 묶음으로 간다(F-02)", () => {
    const assignedIneligibleApplied = candidate({
      profileId: "p1",
      applied: true,
      currentlyAssigned: true,
      eligible: false,
      ineligibleReason: null,
    });
    const assignedIneligibleNotApplied = candidate({
      profileId: "p2",
      applied: false,
      currentlyAssigned: true,
      eligible: false,
      ineligibleReason: "GENDER_MISMATCH",
    });

    const result = groupAssignmentCandidates([
      assignedIneligibleApplied,
      assignedIneligibleNotApplied,
    ]);

    expect(result).toEqual({
      applied: [assignedIneligibleApplied],
      notApplied: [assignedIneligibleNotApplied],
      ineligible: [],
    });
  });

  it("빈 목록은 세 묶음 모두 빈 배열이다", () => {
    expect(groupAssignmentCandidates([])).toEqual({
      applied: [],
      notApplied: [],
      ineligible: [],
    });
  });
});

describe("canSelectCandidateAsTrainee", () => {
  it("정식 배정에 자격 있는 후보도 교육으로 고를 수 있다", () => {
    const eligible = candidate({ eligible: true, ineligibleReason: null });

    expect(canSelectCandidateAsTrainee(eligible)).toBe(true);
  });

  it("가능 포지션이 없을 뿐인 후보(NOT_ELIGIBLE)는 교육으로 고를 수 있다", () => {
    const notEligible = candidate({ eligible: false, ineligibleReason: "NOT_ELIGIBLE" });

    expect(canSelectCandidateAsTrainee(notEligible)).toBe(true);
  });

  it("성별 조건이 맞지 않는 후보(GENDER_MISMATCH)는 교육으로도 고를 수 없다", () => {
    const genderMismatch = candidate({ eligible: false, ineligibleReason: "GENDER_MISMATCH" });

    expect(canSelectCandidateAsTrainee(genderMismatch)).toBe(false);
  });
});
