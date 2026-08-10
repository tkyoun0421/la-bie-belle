export type AssignmentIneligibleReason = "GENDER_MISMATCH" | "NOT_ELIGIBLE";

export type AssignmentCandidate = {
  profileId: string;
  name: string;
  applied: boolean;
  currentlyAssigned: boolean;
  otherPositionNames: string[];
  eligible: boolean;
  ineligibleReason: AssignmentIneligibleReason | null;
};

export type AssignmentCandidateBuckets = {
  applied: AssignmentCandidate[];
  notApplied: AssignmentCandidate[];
  ineligible: AssignmentCandidate[];
};
