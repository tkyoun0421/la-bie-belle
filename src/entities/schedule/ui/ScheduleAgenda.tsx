import { Pressable, View } from "react-native";
import { AccordionRow } from "@/shared/ui/Accordion";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { DAY_SHEET_COPY } from "@/entities/schedule/consts/daySheet.const";
import { SCHEDULE_AGENDA_COPY } from "@/entities/schedule/consts/scheduleAgenda.const";
import { useScheduleAgenda } from "@/entities/schedule/hooks/useScheduleAgenda";
import type { ScheduleAgendaInput } from "@/entities/schedule/model/scheduleAgenda.type";
import { DayRoster } from "@/entities/schedule/ui/DayRoster";

export type ScheduleAgendaProps = ScheduleAgendaInput;

function Loading() {
  return (
    <View className="gap-4 py-4">
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-2/3" />
    </View>
  );
}

function Failed({ onRetry }: { onRetry: () => void }) {
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

export function ScheduleAgenda(props: ScheduleAgendaProps) {
  const agenda = useScheduleAgenda(props);

  if (agenda.state === "loading") {
    return <Loading />;
  }

  if (agenda.state === "failed") {
    return <Failed onRetry={agenda.retry} />;
  }

  if (agenda.empty) {
    return (
      <EmptyState
        scene="no-schedule"
        title={SCHEDULE_AGENDA_COPY.emptyTitle}
        description={SCHEDULE_AGENDA_COPY.emptyDescription}
      />
    );
  }

  return (
    <View>
      {agenda.days.map((day) => (
        <AccordionRow
          key={day.workDate}
          divider={day.divider}
          title={day.title}
          expanded={day.expanded}
          onToggle={day.toggle}
          status={
            <Text size="xs" tone={day.statusTone}>
              {day.statusLabel}
            </Text>
          }
        >
          <DayRoster rows={day.rows} myProfileId={agenda.myProfileId} />
          {day.showActions ? (
            <View className="mt-3 flex-row gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={day.cancelShift}
              >
                {DAY_SHEET_COPY.cancelShift}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onPress={day.requestSwap}
              >
                {DAY_SHEET_COPY.requestSwap}
              </Button>
            </View>
          ) : null}
        </AccordionRow>
      ))}
    </View>
  );
}
