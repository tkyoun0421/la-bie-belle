import { useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { clockOf } from "@/shared/utils/kstDate";
import { SCHEDULE_DAY_COPY } from "@/features/scheduleDay/consts/scheduleDay.const";
import { isDayHoursSaveEnabled } from "@/features/scheduleDay/model/dayHoursForm.policy";
import type {
  DayHoursSheetController,
  DayHoursSheetInput,
} from "@/features/scheduleDay/model/dayHoursSheet.type";
import { useSetDayHoursMutation } from "@/features/scheduleDay/services/useSetDayHoursMutation";

export function useDayHoursSheet({
  workDate,
  startsAt,
  endsAt,
  onDone,
}: DayHoursSheetInput): DayHoursSheetController {
  const [starts, setStarts] = useState(() => clockOf(startsAt));
  const [ends, setEnds] = useState(() => clockOf(endsAt));
  const setHours = useSetDayHoursMutation(supabase);

  useEffect(() => {
    if (setHours.isSuccess) {
      onDone();
    }
  }, [setHours.isSuccess, onDone]);

  return {
    starts,
    ends,
    canSave: isDayHoursSaveEnabled({ starts, ends }),
    sending: setHours.isPending,
    failedLine: setHours.isError ? SCHEDULE_DAY_COPY.saveFailed : null,
    writeStarts: setStarts,
    writeEnds: setEnds,
    save: () => setHours.mutate({ workDate, starts, ends }),
  };
}
