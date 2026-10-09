import { useEffect } from "react";
import { SCHEDULE_ADMIN_SHEET_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type {
  ConfirmSheetController,
  ConfirmSheetFace,
  ConfirmSheetInput,
  ConfirmSheetVacancy,
} from "@/screens/scheduleAdmin/model/confirmSheet.type";
import { formatMonthName } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";
import {
  openSlotLine,
  summarizeOpenSlots,
} from "@/screens/scheduleAdmin/utils/groupOpenSlots.utils";

const RESULT_STAY_MS = 1650;

export function useConfirmSheet({
  month,
  openSlots,
  notifiedCount,
  done,
  failed,
  onClose,
}: ConfirmSheetInput): ConfirmSheetController {
  useEffect(() => {
    if (!done) {
      return;
    }

    const timer = setTimeout(onClose, RESULT_STAY_MS);

    return () => clearTimeout(timer);
  }, [done, onClose]);

  const monthName = formatMonthName(month);
  const summary = summarizeOpenSlots(openSlots);

  const face: ConfirmSheetFace = done ? "done" : failed ? "failed" : "ask";

  const vacancy: ConfirmSheetVacancy | null =
    summary.totalCount === 0
      ? null
      : {
          headLine: `${SCHEDULE_ADMIN_SHEET_COPY.vacancyHeadPrefix}${summary.totalCount}${SCHEDULE_ADMIN_SHEET_COPY.vacancyHeadSuffix}`,
          itemLines: summary.items.map(openSlotLine),
          overflowLine:
            summary.overflowCount === 0
              ? null
              : `${SCHEDULE_ADMIN_SHEET_COPY.vacancyOverflowPrefix}${summary.overflowCount}${SCHEDULE_ADMIN_SHEET_COPY.vacancyOverflowSuffix}`,
        };

  return {
    face,
    doneTitle: `${monthName}${SCHEDULE_ADMIN_SHEET_COPY.confirmedTitleSuffix}`,
    doneNote: `${SCHEDULE_ADMIN_SHEET_COPY.confirmedNotePrefix}${notifiedCount}${SCHEDULE_ADMIN_SHEET_COPY.confirmedNoteSuffix}`,
    askTitle: `${monthName}${SCHEDULE_ADMIN_SHEET_COPY.confirmAskTitleSuffix}`,
    askButtonLabel: `${monthName}${SCHEDULE_ADMIN_SHEET_COPY.confirmAskButtonSuffix}`,
    vacancy,
  };
}
