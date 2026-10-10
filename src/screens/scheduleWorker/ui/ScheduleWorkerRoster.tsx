import { CalendarDays, List } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Card } from "@/shared/ui/Card";
import { Checkbox } from "@/shared/ui/Checkbox";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Segment } from "@/shared/ui/Segment";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { SCHEDULE_AGENDA_COPY } from "@/entities/schedule/consts/scheduleAgenda.const";
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

function AgendaPending() {
  return (
    <View className="gap-4 py-4">
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-2/3" />
    </View>
  );
}

function AgendaFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-row items-center gap-2 py-4">
      <Text size="sm" tone="subtle">
        {SCHEDULE_AGENDA_COPY.failed}
      </Text>

      <Pressable onPress={onRetry} hitSlop={8}>
        <Text size="sm" weight="medium">
          {SCHEDULE_AGENDA_COPY.retry}
        </Text>
      </Pressable>
    </View>
  );
}

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
            pending={<AgendaPending />}
            failed={(retry) => <AgendaFailed onRetry={retry} />}
            empty={
              <EmptyState
                scene="no-schedule"
                title={SCHEDULE_AGENDA_COPY.emptyTitle}
                description={SCHEDULE_AGENDA_COPY.emptyDescription}
              />
            }
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
