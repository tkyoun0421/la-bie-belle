import { SCHEDULE_ADMIN_SHEET_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type {
  CreateScheduleSheetController,
  CreateScheduleSheetInput,
} from "@/screens/scheduleAdmin/model/createScheduleSheet.type";
import { formatMonthName } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";

export function useCreateScheduleSheet({
  month,
  failed,
}: CreateScheduleSheetInput): CreateScheduleSheetController {
  const monthName = formatMonthName(month);

  return {
    title: `${monthName}${SCHEDULE_ADMIN_SHEET_COPY.createTitleSuffix}`,
    noticeLine: `${SCHEDULE_ADMIN_SHEET_COPY.createNoticePrefix}${monthName}${SCHEDULE_ADMIN_SHEET_COPY.createNoticeSuffix}`,
    failedLine: failed ? SCHEDULE_ADMIN_SHEET_COPY.saveFailed : null,
  };
}
