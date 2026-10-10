import { DeadlineSheet } from "@/features/availabilitySubmit/ui/DeadlineSheet";
import { ConfirmSheet } from "@/features/scheduleConfirm/ui/ConfirmSheet";
import { CloseDayWarningSheet } from "@/features/scheduleDay/ui/CloseDayWarningSheet";
import { CreateScheduleSheet } from "@/features/scheduleDay/ui/CreateScheduleSheet";
import { DayHoursSheet } from "@/features/scheduleDay/ui/DayHoursSheet";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";

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
        onClose={screen.closeSheet}
      />
    );
  }

  if (sheet.kind === "deadline") {
    return (
      <DeadlineSheet
        deadline={sheet.deadline}
        today={screen.today}
        canSave={sheet.canSave}
        sending={sheet.sending}
        failedLine={sheet.failedLine}
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
        onClose={screen.closeSheet}
      />
    );
  }

  if (sheet.kind === "hours") {
    return (
      <DayHoursSheet
        workDate={sheet.workDate}
        startsAt={sheet.startsAt}
        endsAt={sheet.endsAt}
        onClose={screen.closeSheet}
      />
    );
  }

  return (
    <CloseDayWarningSheet
      workDate={sheet.workDate}
      assignmentCount={sheet.assignmentCount}
      onCancel={screen.closeSheet}
      onDone={screen.leaveDay}
    />
  );
}
