import { useRef, useState, useTransition } from "react";

import type { AssignmentCandidate } from "@/entities/assignment/types/candidate";
import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type ListCandidatesActionInput = { scheduleId: string; positionId: string };
export type ListCandidatesActionOutcome =
  { ok: true; candidates: AssignmentCandidate[] } | { ok: false; code: ErrorCode };
export type ListAssignmentCandidatesAction = (
  input: ListCandidatesActionInput,
) => Promise<ListCandidatesActionOutcome>;

export type ReplaceAssignmentsActionInput = {
  scheduleId: string;
  positionId: string;
  profileIds: string[];
  traineeProfileIds: string[];
};
export type ReplaceAssignmentsActionOutcome =
  { ok: true; assignedCount: number } | { ok: false; code: ErrorCode };
export type ReplacePositionAssignmentsAction = (
  input: ReplaceAssignmentsActionInput,
) => Promise<ReplaceAssignmentsActionOutcome>;

export type CandidateSelectionTarget = {
  scheduleId: string;
  positionId: string;
  positionName: string;
  requiredCount: number;
};

export type CandidateSelectionOpenParams = CandidateSelectionTarget & { assignedCount: number };

export type CandidateSelectionRole = "assigned" | "trainee";

const SNACKBAR_MESSAGE = "배정을 변경했어요";

function symmetricDifferenceSize(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let count = 0;
  for (const key of a) {
    if (!b.has(key)) count += 1;
  }
  for (const key of b) {
    if (!a.has(key)) count += 1;
  }
  return count;
}

function withoutMember(set: ReadonlySet<string>, profileId: string): Set<string> {
  const next = new Set(set);
  next.delete(profileId);
  return next;
}

function toggleMember(set: ReadonlySet<string>, profileId: string): Set<string> {
  const next = new Set(set);
  if (next.has(profileId)) {
    next.delete(profileId);
  } else {
    next.add(profileId);
  }
  return next;
}

type SelectionPair = { assigned: ReadonlySet<string>; trainee: ReadonlySet<string> };

type UndoMemory = { previousSelection: SelectionPair; count: number };

type UseCandidateSelectionParams = {
  onList: ListAssignmentCandidatesAction;
  onReplace: ReplacePositionAssignmentsAction;
};

export function useCandidateSelection({ onList, onReplace }: UseCandidateSelectionParams) {
  const [target, setTarget] = useState<CandidateSelectionTarget | null>(null);
  const [assignedCount, setAssignedCount] = useState(0);
  const [candidates, setCandidates] = useState<AssignmentCandidate[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [savedSelectedAssigned, setSavedSelectedAssigned] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [savedSelectedTrainee, setSavedSelectedTrainee] = useState<ReadonlySet<string>>(new Set());
  const [selectedAssigned, setSelectedAssigned] = useState<ReadonlySet<string>>(new Set());
  const [selectedTrainee, setSelectedTrainee] = useState<ReadonlySet<string>>(new Set());
  const [submitting, startTransition] = useTransition();
  const [lastUndo, setLastUndo] = useState<UndoMemory | null>(null);
  const requestIdRef = useRef(0);

  function open(params: CandidateSelectionOpenParams) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setTarget({
      scheduleId: params.scheduleId,
      positionId: params.positionId,
      positionName: params.positionName,
      requiredCount: params.requiredCount,
    });
    setAssignedCount(params.assignedCount);
    setCandidates(null);
    setFailed(false);
    setLoading(true);
    setLastUndo(null);
    setSavedSelectedAssigned(new Set());
    setSavedSelectedTrainee(new Set());
    setSelectedAssigned(new Set());
    setSelectedTrainee(new Set());

    void onList({ scheduleId: params.scheduleId, positionId: params.positionId }).then(
      (outcome) => {
        if (requestIdRef.current !== requestId) {
          return;
        }
        setLoading(false);
        if (!outcome.ok) {
          setFailed(true);
          return;
        }
        setCandidates(outcome.candidates);
        const initiallyAssigned = new Set(
          outcome.candidates
            .filter((candidate) => candidate.currentlyAssigned)
            .map((candidate) => candidate.profileId),
        );
        const initiallyTrainee = new Set(
          outcome.candidates
            .filter((candidate) => candidate.currentlyTrainee)
            .map((candidate) => candidate.profileId),
        );
        setSavedSelectedAssigned(initiallyAssigned);
        setSavedSelectedTrainee(initiallyTrainee);
        setSelectedAssigned(initiallyAssigned);
        setSelectedTrainee(initiallyTrainee);
      },
    );
  }

  function close() {
    requestIdRef.current += 1;
    setTarget(null);
    setAssignedCount(0);
    setCandidates(null);
    setLoading(false);
    setFailed(false);
    setSavedSelectedAssigned(new Set());
    setSavedSelectedTrainee(new Set());
    setSelectedAssigned(new Set());
    setSelectedTrainee(new Set());
    setLastUndo(null);
  }

  function toggle(profileId: string, role: CandidateSelectionRole) {
    if (role === "assigned") {
      setSelectedAssigned((previous) => toggleMember(previous, profileId));
      setSelectedTrainee((previous) => withoutMember(previous, profileId));
    } else {
      setSelectedTrainee((previous) => toggleMember(previous, profileId));
      setSelectedAssigned((previous) => withoutMember(previous, profileId));
    }
    setLastUndo(null);
  }

  function submit(nextSelection: SelectionPair) {
    if (target === null) {
      return;
    }
    const changeCountForThisSave =
      symmetricDifferenceSize(nextSelection.assigned, savedSelectedAssigned) +
      symmetricDifferenceSize(nextSelection.trainee, savedSelectedTrainee);
    if (changeCountForThisSave === 0) {
      return;
    }

    const { scheduleId, positionId } = target;
    const previousSelection: SelectionPair = {
      assigned: savedSelectedAssigned,
      trainee: savedSelectedTrainee,
    };

    startTransition(async () => {
      const outcome = await onReplace({
        scheduleId,
        positionId,
        profileIds: Array.from(nextSelection.assigned),
        traineeProfileIds: Array.from(nextSelection.trainee),
      });

      if (!outcome.ok) {
        showSnackbar(ERROR_CODES[outcome.code].message);
        return;
      }

      setSavedSelectedAssigned(nextSelection.assigned);
      setSavedSelectedTrainee(nextSelection.trainee);
      setSelectedAssigned(nextSelection.assigned);
      setSelectedTrainee(nextSelection.trainee);
      setAssignedCount(outcome.assignedCount);
      setLastUndo({ previousSelection, count: changeCountForThisSave });
      showSnackbar(SNACKBAR_MESSAGE);
    });
  }

  function save() {
    submit({ assigned: selectedAssigned, trainee: selectedTrainee });
  }

  function executeUndo() {
    if (lastUndo === null) {
      return;
    }
    submit(lastUndo.previousSelection);
  }

  const changeCount =
    symmetricDifferenceSize(selectedAssigned, savedSelectedAssigned) +
    symmetricDifferenceSize(selectedTrainee, savedSelectedTrainee);

  return {
    target,
    assignedCount,
    candidates,
    loading,
    failed,
    selectedAssigned,
    selectedTrainee,
    toggle,
    changeCount,
    submitting,
    save,
    undo: lastUndo === null ? null : { count: lastUndo.count, execute: executeUndo },
    open,
    close,
  };
}
