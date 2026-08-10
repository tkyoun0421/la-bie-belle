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

type UndoMemory = { previousSelected: ReadonlySet<string>; count: number };

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
  const [savedSelected, setSavedSelected] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
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
    setSavedSelected(new Set());
    setSelected(new Set());

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
        setSavedSelected(initiallyAssigned);
        setSelected(initiallyAssigned);
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
    setSavedSelected(new Set());
    setSelected(new Set());
    setLastUndo(null);
  }

  function toggle(profileId: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
    setLastUndo(null);
  }

  function submit(nextSelection: ReadonlySet<string>) {
    if (target === null) {
      return;
    }
    const changeCountForThisSave = symmetricDifferenceSize(nextSelection, savedSelected);
    if (changeCountForThisSave === 0) {
      return;
    }

    const { scheduleId, positionId } = target;
    const previousSelected = savedSelected;

    startTransition(async () => {
      const outcome = await onReplace({
        scheduleId,
        positionId,
        profileIds: Array.from(nextSelection),
      });

      if (!outcome.ok) {
        showSnackbar(ERROR_CODES[outcome.code].message);
        return;
      }

      setSavedSelected(nextSelection);
      setSelected(nextSelection);
      setAssignedCount(outcome.assignedCount);
      setLastUndo({ previousSelected, count: changeCountForThisSave });
      showSnackbar(SNACKBAR_MESSAGE);
    });
  }

  function save() {
    submit(selected);
  }

  function executeUndo() {
    if (lastUndo === null) {
      return;
    }
    submit(lastUndo.previousSelected);
  }

  const changeCount = symmetricDifferenceSize(selected, savedSelected);

  return {
    target,
    assignedCount,
    candidates,
    loading,
    failed,
    selected,
    toggle,
    changeCount,
    submitting,
    save,
    undo: lastUndo === null ? null : { count: lastUndo.count, execute: executeUndo },
    open,
    close,
  };
}
