"use client";

import Link from "next/link";

import type { ScheduleApplicant } from "@/entities/schedule/model/schedule-applicant";
import type { ManagedRecruitmentSchedule } from "@/features/recruitment/hooks/useRecruitmentManage";
import { ADMIN_SCHEDULE_PATH } from "@/shared/config/auth-routes.config";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const STATUS_CONFLICT_MESSAGE = "상태가 바뀌었어요. 새로고침 후 다시 확인해 주세요";
const APPLICANTS_LOADING_MESSAGE = "신청 현황을 불러오는 중이에요";
const APPLICANTS_FAILED_MESSAGE = "신청 현황을 불러오지 못했어요. 시트를 다시 열어 시도해 주세요";
const APPLICANTS_EMPTY_MESSAGE = "아직 신청자가 없어요";

type RecruitmentManageSheetProps = {
  managed: ManagedRecruitmentSchedule | null;
  deadline: string;
  onDeadlineChange: (value: string) => void;
  deadlineError: string | null;
  statusConflict: boolean;
  pending: boolean;
  applicants: ScheduleApplicant[] | null;
  applicantsLoading: boolean;
  applicantsFailed: boolean;
  onSubmit: () => void;
  onClose: () => void;
};

function ApplicantsSection({
  applicants,
  loading,
  failed,
}: {
  applicants: ScheduleApplicant[] | null;
  loading: boolean;
  failed: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <h2 className="typo-label text-text">신청 현황</h2>
      {loading ? <p className="typo-caption text-text">{APPLICANTS_LOADING_MESSAGE}</p> : null}
      {!loading && failed ? (
        <p className="typo-caption text-danger">{APPLICANTS_FAILED_MESSAGE}</p>
      ) : null}
      {!loading && !failed ? (
        <>
          <p className="typo-body-strong text-text-strong">신청 {applicants?.length ?? 0}명</p>
          {applicants && applicants.length > 0 ? (
            <ul className="flex flex-wrap gap-x-1">
              {applicants.map((applicant, index) => (
                <li key={`${applicant.name}-${index}`} className="typo-body text-text">
                  {applicant.name}
                  {index < applicants.length - 1 ? "," : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="typo-body text-text">{APPLICANTS_EMPTY_MESSAGE}</p>
          )}
        </>
      ) : null}
    </div>
  );
}

export function RecruitmentManageSheet({
  managed,
  deadline,
  onDeadlineChange,
  deadlineError,
  statusConflict,
  pending,
  applicants,
  applicantsLoading,
  applicantsFailed,
  onSubmit,
  onClose,
}: RecruitmentManageSheetProps) {
  const isReopen = managed?.status === "CLOSED";

  return (
    <BottomSheet
      open={managed !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={isReopen ? "모집 재오픈" : "마감일 연장"}
      description={
        managed
          ? `근무일 ${managed.workDate} · 현재 마감일 ${managed.applicationDeadline}`
          : undefined
      }
      footer={
        <Button
          variant="primary"
          onClick={onSubmit}
          loading={pending}
          disabled={pending || deadlineError !== null}
        >
          {isReopen ? "재오픈" : "저장"}
        </Button>
      }
    >
      <div className="flex flex-col gap-3 py-4">
        {statusConflict ? (
          <p className="typo-caption text-danger">{STATUS_CONFLICT_MESSAGE}</p>
        ) : null}
        <Input
          label="새 마감일"
          type="date"
          value={deadline}
          onChange={(event) => onDeadlineChange(event.target.value)}
          error={deadlineError ?? undefined}
        />
        {managed ? (
          <Button asChild variant="tertiary">
            <Link href={`${ADMIN_SCHEDULE_PATH}/${managed.id}`}>예식·시간 관리</Link>
          </Button>
        ) : null}
        <ApplicantsSection
          applicants={applicants}
          loading={applicantsLoading}
          failed={applicantsFailed}
        />
      </div>
    </BottomSheet>
  );
}
