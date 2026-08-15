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
  if (candidate.otherPositionNames.length > 0) {
    return false;
  }
  if (candidate.currentlyTrainee) {
    return true;
  }
  return candidate.eligible === true || candidate.ineligibleReason === "NOT_ELIGIBLE";
}
