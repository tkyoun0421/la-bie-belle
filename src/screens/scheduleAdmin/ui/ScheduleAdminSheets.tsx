import { SheetLayer } from "@/shared/ui/SheetLayer";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";
import { ScheduleAdminSheetBody } from "@/screens/scheduleAdmin/ui/ScheduleAdminSheetBody";

export type ScheduleAdminSheetsProps = {
  screen: ScheduleAdminScreenController;
};

export function ScheduleAdminSheets({ screen }: ScheduleAdminSheetsProps) {
  if (screen.sheet === null) {
    return null;
  }

  return (
    <SheetLayer onDismiss={screen.closeSheet}>
      <ScheduleAdminSheetBody screen={screen} />
    </SheetLayer>
  );
}
