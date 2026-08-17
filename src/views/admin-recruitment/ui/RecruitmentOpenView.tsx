"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { ApplicationCountEntry } from "@/entities/schedule/model/application-count";
import type { RecruitmentSchedule } from "@/entities/schedule/model/recruitment-schedule";
import {
  useOpenRecruitment,
  type OpenRecruitmentInput,
  type OpenRecruitmentOutcome,
} from "@/features/recruitment/hooks/useOpenRecruitment";
import {
  useRecruitmentManage,
  type RecruitmentManageActionInput,
  type RecruitmentManageOutcome,
} from "@/features/recruitment/hooks/useRecruitmentManage";
import {
  useScheduleApplicants,
  type ListApplicantsInput,
  type ListApplicantsOutcome,
} from "@/features/recruitment/hooks/useScheduleApplicants";
import { RecruitmentManageSheet } from "@/features/recruitment/ui/RecruitmentManageSheet";
import { RecruitmentSubmitPanel } from "@/features/recruitment/ui/RecruitmentSubmitPanel";
import { ADMIN_RECRUITMENT_PATH } from "@/shared/config/auth-routes.config";
import { Calendar } from "@/shared/ui/calendar";
import { toRecruitmentCellStates } from "@/views/admin-recruitment/model/recruitment-cell-state";
import { validateRecruitmentDeadline } from "@/views/admin-recruitment/model/recruitment-deadline";
import { validateManageDeadline } from "@/views/admin-recruitment/model/recruitment-manage-deadline";
import { findManageableRecruitmentSchedule } from "@/views/admin-recruitment/model/recruitment-manage-target";
import { toggleRecruitmentDate } from "@/views/admin-recruitment/model/recruitment-selection";

const DATE_KEY_FORMAT = "yyyy-MM-dd";
const MONTH_PARAM_FORMAT = "yyyy-MM";

type RecruitmentOpenViewProps = {
  month: string;
  today: string;
  schedules: readonly RecruitmentSchedule[];
  applicationCounts: readonly ApplicationCountEntry[];
  onOpen: (input: OpenRecruitmentInput) => Promise<OpenRecruitmentOutcome>;
  onExtend: (input: RecruitmentManageActionInput) => Promise<RecruitmentManageOutcome>;
  onReopen: (input: RecruitmentManageActionInput) => Promise<RecruitmentManageOutcome>;
  onListApplicants: (input: ListApplicantsInput) => Promise<ListApplicantsOutcome>;
};

export function RecruitmentOpenView({
  month: monthParam,
  today,
  schedules,
  applicationCounts,
  onOpen,
  onExtend,
  onReopen,
  onListApplicants,
}: RecruitmentOpenViewProps) {
  const router = useRouter();
  const [selectedDates, setSelectedDates] = useState<ReadonlySet<string>>(new Set());
  const [deadline, setDeadline] = useState("");

  const { pending, conflictDates, submit } = useOpenRecruitment(onOpen, () => {
    setSelectedDates(new Set());
    setDeadline("");
  });

  const manage = useRecruitmentManage(onExtend, onReopen);
  const applicants = useScheduleApplicants(onListApplicants);

  const month = useMemo(() => new Date(`${monthParam}-01T00:00:00`), [monthParam]);

  const dateStates = useMemo(
    () => toRecruitmentCellStates({ month, schedules, selectedDates, today, applicationCounts }),
    [month, schedules, selectedDates, today, applicationCounts],
  );

  const deadlineValidation = validateRecruitmentDeadline({ deadline, selectedDates, today });
  const deadlineError = deadline.length > 0 ? deadlineValidation : null;
  const submitDisabled = selectedDates.size === 0 || deadlineValidation !== null;

  const manageDeadlineError = manage.managed
    ? validateManageDeadline({
        deadline: manage.deadline,
        today,
        workDate: manage.managed.workDate,
      })
    : null;

  function handleSelectDate(date: Date) {
    const key = format(date, DATE_KEY_FORMAT);
    const manageable = findManageableRecruitmentSchedule(schedules, key);
    if (manageable !== null) {
      manage.open(manageable);
      applicants.load(manageable.id);
      return;
    }
    setSelectedDates((previous) => toggleRecruitmentDate(previous, key));
  }

  function handleCloseManageSheet() {
    manage.close();
    applicants.reset();
  }

  function handleMonthChange(nextMonth: Date) {
    router.push(`${ADMIN_RECRUITMENT_PATH}?month=${format(nextMonth, MONTH_PARAM_FORMAT)}`);
  }

  function handleSubmit() {
    if (submitDisabled) {
      return;
    }
    submit({ dates: Array.from(selectedDates), applicationDeadline: deadline });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6 pb-12">
      <h1 className="typo-headline-md text-text-strong">모집 오픈</h1>
      <Calendar
        month={month}
        today={new Date(`${today}T00:00:00`)}
        dateStates={dateStates}
        onSelectDate={handleSelectDate}
        onMonthChange={handleMonthChange}
      />
      <RecruitmentSubmitPanel
        selectedCount={selectedDates.size}
        deadline={deadline}
        onDeadlineChange={setDeadline}
        deadlineError={deadlineError}
        conflictDates={conflictDates}
        pending={pending}
        submitDisabled={submitDisabled}
        onSubmit={handleSubmit}
      />
      <RecruitmentManageSheet
        managed={manage.managed}
        deadline={manage.deadline}
        onDeadlineChange={manage.setDeadline}
        deadlineError={manageDeadlineError}
        statusConflict={manage.statusConflict}
        pending={manage.pending}
        applicants={applicants.applicants}
        applicantsLoading={applicants.loading}
        applicantsFailed={applicants.failed}
        onSubmit={manage.submit}
        onClose={handleCloseManageSheet}
      />
    </main>
  );
}
