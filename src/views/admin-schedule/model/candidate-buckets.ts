import type {
  AssignmentCandidate,
  AssignmentCandidateBuckets,
} from "@/entities/assignment/types/candidate";

export function groupAssignmentCandidates(
  candidates: readonly AssignmentCandidate[],
): AssignmentCandidateBuckets {
  const applied: AssignmentCandidate[] = [];
  const notApplied: AssignmentCandidate[] = [];
  const ineligible: AssignmentCandidate[] = [];

  for (const candidate of candidates) {
    if (!candidate.eligible && !candidate.currentlyAssigned) {
      ineligible.push(candidate);
      continue;
    }
    if (candidate.applied) {
      applied.push(candidate);
    } else {
      notApplied.push(candidate);
    }
  }

  return { applied, notApplied, ineligible };
}

export function canSelectCandidateAsTrainee(candidate: AssignmentCandidate): boolean {
  return candidate.ineligibleReason !== "GENDER_MISMATCH";
}
