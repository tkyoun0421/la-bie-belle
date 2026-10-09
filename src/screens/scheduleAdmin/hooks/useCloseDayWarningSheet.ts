import { SCHEDULE_ADMIN_SHEET_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type {
  CloseDayWarningSheetController,
  CloseDayWarningSheetInput,
} from "@/screens/scheduleAdmin/model/closeDayWarningSheet.type";
import { closeDayWarningLine } from "@/screens/scheduleAdmin/utils/dayDetailRows.utils";
import { formatBareDate } from "@/screens/scheduleAdmin/utils/formatScheduleDate.utils";

export function useCloseDayWarningSheet({
  workDate,
  assignmentCount,
}: CloseDayWarningSheetInput): CloseDayWarningSheetController {
  return {
    title: `${formatBareDate(workDate)}${SCHEDULE_ADMIN_SHEET_COPY.closeDayTitleSuffix}`,
    warningLine: closeDayWarningLine(assignmentCount),
  };
}
