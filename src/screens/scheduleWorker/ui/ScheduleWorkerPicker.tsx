import { Text } from "@/shared/ui/Text";
import type { ScheduleWorkerScreenController } from "@/screens/scheduleWorker/hooks/useScheduleWorkerScreen";
import { ScheduleCalendarCard } from "@/screens/scheduleWorker/ui/ScheduleCalendarCard";

export type ScheduleWorkerPickerProps = {
  screen: ScheduleWorkerScreenController;
};

export function ScheduleWorkerPicker({ screen }: ScheduleWorkerPickerProps) {
  return (
    <>
      {screen.deadlineLine === null ? null : (
        <Text size="xs" tone="subtle" numeric className="py-1">
          {screen.deadlineLine}
        </Text>
      )}

      <ScheduleCalendarCard
        month={screen.month}
        stateOf={screen.cellStateOf}
        isToday={screen.isToday}
        canPress={screen.canPressDay}
        onPressDay={screen.pressDay}
      />

      {screen.notice === null ? null : (
        <Text size="sm" tone="muted">
          {screen.notice}
        </Text>
      )}
    </>
  );
}
