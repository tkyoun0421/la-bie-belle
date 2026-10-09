import { FloatingToast } from "@/shared/ui/FloatingToast";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";

export type ScheduleAdminToastProps = {
  screen: ScheduleAdminScreenController;
};

export function ScheduleAdminToast({ screen }: ScheduleAdminToastProps) {
  if (screen.toast === null) {
    return null;
  }

  return (
    <FloatingToast
      kind={screen.toast.kind}
      message={screen.toast.message}
      onDone={screen.dismissToast}
    />
  );
}
