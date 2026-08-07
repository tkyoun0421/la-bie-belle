"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  month: Date;
  today: string;
  schedules: readonly RecruitmentSchedule[];
  onOpen: (input: OpenRecruitmentInput) => Promise<OpenRecruitmentOutcome>;
  onExtend: (input: RecruitmentManageActionInput) => Promise<RecruitmentManageOutcome>;
  onReopen: (input: RecruitmentManageActionInput) => Promise<RecruitmentManageOutcome>;
};

export function RecruitmentOpenView({
  month,
  today,
  schedules,
  onOpen,
  onExtend,
  onReopen,
}: RecruitmentOpenViewProps) {
  const router = useRouter();
  const [selectedDates, setSelectedDates] = useState<ReadonlySet<string>>(new Set());
  const [deadline, setDeadline] = useState("");

  const { pending, conflictDates, submit } = useOpenRecruitment(onOpen, () => {
    setSelectedDates(new Set());
    setDeadline("");
  });

  const manage = useRecruitmentManage(onExtend, onReopen);

  const dateStates = useMemo(
    () => toRecruitmentCellStates({ month, schedules, selectedDates, today }),
    [month, schedules, selectedDates, today],
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
      return;
    }
    setSelectedDates((previous) => toggleRecruitmentDate(previous, key));
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
      <h1 className="typo-display text-text-strong">모집 오픈</h1>
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
        onSubmit={manage.submit}
        onClose={manage.close}
      />
    </main>
  );
}
