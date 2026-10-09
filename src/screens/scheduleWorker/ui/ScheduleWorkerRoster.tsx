import { CalendarDays, List } from "lucide-react-native";
import { View } from "react-native";
import { Card } from "@/shared/ui/Card";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Segment } from "@/shared/ui/Segment";
import { Text } from "@/shared/ui/Text";
import { ScheduleAgenda } from "@/entities/schedule/ui/ScheduleAgenda";
import { SCHEDULE_WORKER_COPY } from "@/screens/scheduleWorker/consts/scheduleWorker.const";
import type { ScheduleWorkerScreenController } from "@/screens/scheduleWorker/hooks/useScheduleWorkerScreen";
import { ScheduleCalendarCard } from "@/screens/scheduleWorker/ui/ScheduleCalendarCard";

const VIEW_OPTIONS = [
  {
    value: "calendar",
    icon: CalendarDays,
    accessibilityLabel: SCHEDULE_WORKER_COPY.calendarView,
  },
  {
    value: "position",
    icon: List,
    accessibilityLabel: SCHEDULE_WORKER_COPY.positionView,
  },
];

export type ScheduleWorkerRosterProps = {
  screen: ScheduleWorkerScreenController;
};

export function ScheduleWorkerRoster({ screen }: ScheduleWorkerRosterProps) {
  return (
    <>
      <View className="flex-row items-center justify-between gap-3 py-1">
        <Segment
          options={VIEW_OPTIONS}
          value={screen.view}
          onChange={screen.showView}
          className="flex-1"
        />
        <Checkbox
          label={SCHEDULE_WORKER_COPY.mineOnly}
          checked={screen.showMineOnly}
          onCheckedChange={screen.showMine}
        />
      </View>

      {screen.view === "position" ? (
        <Card className="py-0">
          <ScheduleAgenda
            month={screen.month}
            myProfileId={screen.myProfileId}
            showMineOnly={screen.showMineOnly}
            expanded={screen.expanded}
            onToggle={screen.toggleAgendaDay}
            onCancelShift={screen.askCancelOn}
            onRequestSwap={screen.requestSwap}
          />
        </Card>
      ) : (
        <ScheduleCalendarCard
          month={screen.month}
          stateOf={screen.cellStateOf}
          isToday={screen.isToday}
          canPress={screen.canPressDay}
          onPressDay={screen.pressDay}
        />
      )}

      <Text size="xs" tone="subtle">
        {screen.calendarNote}
      </Text>
    </>
  );
}
