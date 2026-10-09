import { useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { formatMonthName } from "@/entities/schedule/utils/formatScheduleDate.utils";
import { SCHEDULE_DAY_COPY } from "@/features/scheduleDay/consts/scheduleDay.const";
import type {
  CreateScheduleSheetController,
  CreateScheduleSheetInput,
} from "@/features/scheduleDay/model/createScheduleSheet.type";
import { useCreateScheduleMutation } from "@/features/scheduleDay/services/useCreateScheduleMutation";

export function useCreateScheduleSheet({
  month,
  today,
  onDone,
}: CreateScheduleSheetInput): CreateScheduleSheetController {
  const [deadline, setDeadline] = useState("");
  const create = useCreateScheduleMutation(supabase);
  const monthName = formatMonthName(month);

  useEffect(() => {
    if (create.isSuccess) {
      onDone();
    }
  }, [create.isSuccess, onDone]);

  return {
    title: `${monthName}${SCHEDULE_DAY_COPY.createTitleSuffix}`,
    noticeLine: `${SCHEDULE_DAY_COPY.createNoticePrefix}${monthName}${SCHEDULE_DAY_COPY.createNoticeSuffix}`,
    failedLine: create.isError ? SCHEDULE_DAY_COPY.saveFailed : null,
    deadline,
    canSave: deadline >= today,
    saving: create.isPending,
    writeDeadline: setDeadline,
    create: () => create.mutate({ month, deadline }),
  };
}
