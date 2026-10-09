import { useEffect } from "react";
import { supabase } from "@/shared/api/supabase";
import { formatBareDate } from "@/entities/schedule/utils/formatScheduleDate.utils";
import { SCHEDULE_DAY_COPY } from "@/features/scheduleDay/consts/scheduleDay.const";
import type {
  CloseDayWarningSheetController,
  CloseDayWarningSheetInput,
} from "@/features/scheduleDay/model/closeDayWarningSheet.type";
import { useCloseDayMutation } from "@/features/scheduleDay/services/useCloseDayMutation";
import { closeDayWarningLine } from "@/features/scheduleDay/utils/closeDayWarning.utils";

export function useCloseDayWarningSheet({
  workDate,
  assignmentCount,
  onDone,
}: CloseDayWarningSheetInput): CloseDayWarningSheetController {
  const close = useCloseDayMutation(supabase);

  useEffect(() => {
    if (close.isSuccess) {
      onDone();
    }
  }, [close.isSuccess, onDone]);

  return {
    title: `${formatBareDate(workDate)}${SCHEDULE_DAY_COPY.closeDayTitleSuffix}`,
    warningLine: closeDayWarningLine(assignmentCount),
    closing: close.isPending,
    close: () => close.mutate({ workDate }),
  };
}
