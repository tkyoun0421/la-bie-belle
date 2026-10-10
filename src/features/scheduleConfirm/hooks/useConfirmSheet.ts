import { useEffect } from "react";
import { supabase } from "@/shared/api/supabase";
import { formatMonthName } from "@/entities/schedule/utils/formatScheduleDate.utils";
import {
  openSlotLine,
  summarizeOpenSlots,
} from "@/entities/schedule/utils/groupOpenSlots.utils";
import { SCHEDULE_CONFIRM_COPY } from "@/features/scheduleConfirm/consts/scheduleConfirm.const";
import type {
  ConfirmSheetController,
  ConfirmSheetFace,
  ConfirmSheetInput,
  ConfirmSheetVacancy,
} from "@/features/scheduleConfirm/model/confirmSheet.type";
import { useConfirmScheduleMutation } from "@/features/scheduleConfirm/services/useConfirmScheduleMutation";

const RESULT_STAY_MS = 1650;

export function useConfirmSheet({
  month,
  openSlots,
  notifiedCount,
  onClose,
}: ConfirmSheetInput): ConfirmSheetController {
  const confirm = useConfirmScheduleMutation(supabase);
  const done = confirm.isSuccess;

  useEffect(() => {
    if (!done) {
      return;
    }

    const timer = setTimeout(onClose, RESULT_STAY_MS);

    return () => clearTimeout(timer);
  }, [done, onClose]);

  const monthName = formatMonthName(month);
  const summary = summarizeOpenSlots(openSlots);

  const face: ConfirmSheetFace = done
    ? "done"
    : confirm.isError
      ? "failed"
      : "ask";

  const vacancy: ConfirmSheetVacancy | null =
    summary.totalCount === 0
      ? null
      : {
          headLine: `${SCHEDULE_CONFIRM_COPY.vacancyHeadPrefix}${summary.totalCount}${SCHEDULE_CONFIRM_COPY.vacancyHeadSuffix}`,
          itemLines: summary.items.map(openSlotLine),
          overflowLine:
            summary.overflowCount === 0
              ? null
              : `${SCHEDULE_CONFIRM_COPY.vacancyOverflowPrefix}${summary.overflowCount}${SCHEDULE_CONFIRM_COPY.vacancyOverflowSuffix}`,
        };

  return {
    face,
    doneTitle: `${monthName}${SCHEDULE_CONFIRM_COPY.confirmedTitleSuffix}`,
    doneNote: `${SCHEDULE_CONFIRM_COPY.confirmedNotePrefix}${notifiedCount}${SCHEDULE_CONFIRM_COPY.confirmedNoteSuffix}`,
    askTitle: `${monthName}${SCHEDULE_CONFIRM_COPY.confirmAskTitleSuffix}`,
    askButtonLabel: `${monthName}${SCHEDULE_CONFIRM_COPY.confirmAskButtonSuffix}`,
    vacancy,
    sending: confirm.isPending,
    confirm: () => confirm.mutate({ month }),
  };
}
