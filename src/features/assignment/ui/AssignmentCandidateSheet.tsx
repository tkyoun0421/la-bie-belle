"use client";

import { assignmentIneligibleReasonLabel } from "@/entities/assignment/model/ineligible-reason";
import type {
  AssignmentCandidate,
  AssignmentCandidateBuckets,
} from "@/entities/assignment/types/candidate";
import type { CandidateSelectionTarget } from "@/features/assignment/hooks/useCandidateSelection";
import { Badge } from "@/shared/ui/badge";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";

const LOADING_MESSAGE = "후보를 불러오는 중이에요";
const FAILED_MESSAGE = "후보를 불러오지 못했어요. 시트를 다시 열어 시도해 주세요";
const APPLIED_HEADING = "신청함";
const NOT_APPLIED_HEADING = "신청 안 함";
const EMPTY_APPLIED_MESSAGE = "신청한 근무자가 없어요";
const EMPTY_NOT_APPLIED_MESSAGE = "신청하지 않은 근무자가 없어요";

type AssignmentUndo = { count: number; execute: () => void };

type AssignmentCandidateSheetProps = {
  target: CandidateSelectionTarget | null;
  assignedCount: number;
  loading: boolean;
  failed: boolean;
  buckets: AssignmentCandidateBuckets;
  selected: ReadonlySet<string>;
  onToggle: (profileId: string) => void;
  changeCount: number;
  submitting: boolean;
  onSave: () => void;
  undo: AssignmentUndo | null;
  onClose: () => void;
};

function CandidateRow({
  candidate,
  selected,
  onToggle,
}: {
  candidate: AssignmentCandidate;
  selected: boolean;
  onToggle: (profileId: string) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <div className="flex flex-col gap-1">
        <span className="typo-body text-text-strong">{candidate.name}</span>
        {candidate.otherPositionNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {candidate.otherPositionNames.map((name) => (
              <Badge key={name} tone="neutral">
                {name}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <Chip selected={selected} onSelectedChange={() => onToggle(candidate.profileId)}>
        {selected ? "선택됨" : "선택"}
      </Chip>
    </li>
  );
}

function IneligibleRow({ candidate }: { candidate: AssignmentCandidate }) {
  return (
    <li className="flex flex-col gap-1 py-2">
      <span className="typo-body text-text-strong">{candidate.name}</span>
      {candidate.ineligibleReason ? (
        <span className="typo-caption text-text">
          {assignmentIneligibleReasonLabel(candidate.ineligibleReason)}
        </span>
      ) : null}
    </li>
  );
}

export function AssignmentCandidateSheet({
  target,
  assignedCount,
  loading,
  failed,
  buckets,
  selected,
  onToggle,
  changeCount,
  submitting,
  onSave,
  undo,
  onClose,
}: AssignmentCandidateSheetProps) {
  return (
    <BottomSheet
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={target?.positionName ?? ""}
      description={target ? `필요 ${target.requiredCount} / 배정 ${assignedCount}` : undefined}
      footer={
        undo !== null ? (
          <Button
            variant="secondary"
            loading={submitting}
            disabled={submitting}
            onClick={undo.execute}
          >
            {`방금 변경한 ${undo.count}명 되돌리기`}
          </Button>
        ) : (
          <div className="flex items-center justify-between">
            <span className="typo-label text-text-strong">{`${changeCount}개 변경`}</span>
            <Button
              variant="primary"
              loading={submitting}
              disabled={changeCount === 0 || submitting}
              onClick={onSave}
            >
              저장
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-4 py-4">
        {loading ? <p className="typo-caption text-text">{LOADING_MESSAGE}</p> : null}
        {!loading && failed ? <p className="typo-caption text-danger">{FAILED_MESSAGE}</p> : null}
        {!loading && !failed ? (
          <>
            <div className="flex flex-col gap-2">
              <h3 className="typo-label text-text">{APPLIED_HEADING}</h3>
              {buckets.applied.length > 0 ? (
                <ul className="flex flex-col divide-y divide-border">
                  {buckets.applied.map((candidate) => (
                    <CandidateRow
                      key={candidate.profileId}
                      candidate={candidate}
                      selected={selected.has(candidate.profileId)}
                      onToggle={onToggle}
                    />
                  ))}
                </ul>
              ) : (
                <p className="typo-body text-text">{EMPTY_APPLIED_MESSAGE}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="typo-label text-text">{NOT_APPLIED_HEADING}</h3>
              {buckets.notApplied.length > 0 ? (
                <ul className="flex flex-col divide-y divide-border">
                  {buckets.notApplied.map((candidate) => (
                    <CandidateRow
                      key={candidate.profileId}
                      candidate={candidate}
                      selected={selected.has(candidate.profileId)}
                      onToggle={onToggle}
                    />
                  ))}
                </ul>
              ) : (
                <p className="typo-body text-text">{EMPTY_NOT_APPLIED_MESSAGE}</p>
              )}
            </div>
            {buckets.ineligible.length > 0 ? (
              <details className="flex flex-col gap-2 border-t border-border pt-3">
                <summary className="typo-caption text-text">
                  {`조건에 맞지 않는 ${buckets.ineligible.length}명 보기`}
                </summary>
                <ul className="flex flex-col divide-y divide-border">
                  {buckets.ineligible.map((candidate) => (
                    <IneligibleRow key={candidate.profileId} candidate={candidate} />
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        ) : null}
      </div>
    </BottomSheet>
  );
}
