import { useState, useTransition } from "react";

import type { RecruitmentSchedule } from "@/entities/schedule/model/recruitment-schedule";
import { ERROR_CODE, ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

export type ManagedRecruitmentSchedule = RecruitmentSchedule;

export type RecruitmentManageActionInput = { scheduleId: string; newDeadline: string };

export type RecruitmentManageOutcome = { ok: true } | { ok: false; code: ErrorCode };

export function useRecruitmentManage(
  onExtend: (input: RecruitmentManageActionInput) => Promise<RecruitmentManageOutcome>,
  onReopen: (input: RecruitmentManageActionInput) => Promise<RecruitmentManageOutcome>,
) {
  const [managed, setManaged] = useState<ManagedRecruitmentSchedule | null>(null);
  const [deadline, setDeadline] = useState("");
  const [statusConflict, setStatusConflict] = useState(false);
  const [pending, startTransition] = useTransition();

  function open(schedule: ManagedRecruitmentSchedule) {
    setManaged(schedule);
    setDeadline(schedule.applicationDeadline);
    setStatusConflict(false);
  }

  function close() {
    setManaged(null);
    setDeadline("");
    setStatusConflict(false);
  }

  function submit() {
    if (managed === null) {
      return;
    }
    const isReopen = managed.status === "CLOSED";
    const action = isReopen ? onReopen : onExtend;

    setStatusConflict(false);
    startTransition(async () => {
      const outcome = await action({ scheduleId: managed.id, newDeadline: deadline });

      if (outcome.ok) {
        showSnackbar(isReopen ? "모집을 다시 열었어요" : "마감일을 연장했어요");
        close();
        return;
      }

      if (outcome.code === ERROR_CODE.SCHEDULING_STATUS_CONFLICT) {
        setStatusConflict(true);
      }
      showSnackbar(ERROR_CODES[outcome.code].message);
    });
  }

  return { managed, deadline, setDeadline, pending, statusConflict, open, close, submit };
}
