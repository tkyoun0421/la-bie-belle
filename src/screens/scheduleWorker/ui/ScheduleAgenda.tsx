import { View } from "react-native";
import { AccordionRow } from "@/shared/ui/Accordion";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Text } from "@/shared/ui/Text";
import { useScheduleAgenda } from "@/screens/scheduleWorker/hooks/useScheduleAgenda";
import type { ScheduleAgendaInput } from "@/screens/scheduleWorker/model/scheduleAgenda.type";
import { DayRoster } from "@/screens/scheduleWorker/ui/DayRoster";

export type ScheduleAgendaProps = ScheduleAgendaInput & {
  myProfileId: string | null;
};

export function ScheduleAgenda({ myProfileId, ...input }: ScheduleAgendaProps) {
  const agenda = useScheduleAgenda(input);

  if (agenda.empty) {
    return (
      <EmptyState
        scene="no-schedule"
        title="보여줄 날이 없어요"
        description="이 달에 열린 날이 아직 없어요"
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
          <DayRoster rows={day.rows} myProfileId={myProfileId} />
          {day.showActions ? (
            <View className="mt-3 flex-row gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={day.cancelShift}
              >
                근무 취소
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onPress={day.requestSwap}
              >
                교대 요청
              </Button>
            </View>
          ) : null}
        </AccordionRow>
      ))}
    </View>
  );
}
