import { DeadlineSheet } from "@/features/availabilitySubmit/ui/DeadlineSheet";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";
import { CloseDayWarningSheet } from "@/screens/scheduleAdmin/ui/CloseDayWarningSheet";
import { ConfirmSheet } from "@/screens/scheduleAdmin/ui/ConfirmSheet";
import { CreateScheduleSheet } from "@/screens/scheduleAdmin/ui/CreateScheduleSheet";
import { DayHoursSheet } from "@/screens/scheduleAdmin/ui/DayHoursSheet";

export type ScheduleAdminSheetBodyProps = {
  screen: ScheduleAdminScreenController;
};

export function ScheduleAdminSheetBody({
  screen,
}: ScheduleAdminSheetBodyProps) {
  const sheet = screen.sheet;

  if (sheet === null) {
    return null;
  }

  if (sheet.kind === "create") {
    return (
      <CreateScheduleSheet
        month={screen.month}
        today={screen.today}
        deadline={sheet.deadline}
        canSave={sheet.canSave}
        saving={sheet.saving}
        failed={sheet.failed}
        onWriteDeadline={screen.writeCreateDeadline}
        onClose={screen.closeSheet}
        onCreate={screen.createSchedule}
      />
    );
  }

  if (sheet.kind === "deadline") {
    return (
      <DeadlineSheet
        deadline={sheet.deadline}
        today={screen.today}
        canSave={sheet.canSave}
        saving={sheet.saving}
        failed={sheet.failed}
        onChange={screen.changeDeadlineDraft}
        onClose={screen.closeSheet}
        onSave={screen.saveDeadline}
      />
    );
  }

  if (sheet.kind === "confirm") {
    return (
      <ConfirmSheet
        month={screen.month}
        openSlots={sheet.openSlots}
        notifiedCount={sheet.notifiedCount}
        confirming={sheet.confirming}
        done={sheet.done}
        failed={sheet.failed}
        onClose={screen.closeSheet}
        onConfirm={screen.confirmMonth}
      />
    );
  }

  if (sheet.kind === "hours") {
    return (
      <DayHoursSheet
        starts={sheet.starts}
        ends={sheet.ends}
        canSave={sheet.canSave}
        saving={sheet.saving}
        failed={sheet.failed}
        onWriteStarts={screen.writeHoursStarts}
        onWriteEnds={screen.writeHoursEnds}
        onClose={screen.closeSheet}
        onSave={screen.saveHours}
      />
    );
  }

  return (
    <CloseDayWarningSheet
      workDate={sheet.workDate}
      assignmentCount={sheet.assignmentCount}
      closing={sheet.closing}
      onCancel={screen.closeSheet}
      onConfirm={screen.closeDay}
    />
  );
}
