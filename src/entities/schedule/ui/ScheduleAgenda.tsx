import type { ReactNode } from "react";
import { View } from "react-native";
import { AccordionRow } from "@/shared/ui/Accordion";
import { Button } from "@/shared/ui/Button";
import { FragmentView } from "@/shared/ui/FragmentView";
import { Text } from "@/shared/ui/Text";
import { DAY_SHEET_COPY } from "@/entities/schedule/consts/daySheet.const";
import { useScheduleAgenda } from "@/entities/schedule/hooks/useScheduleAgenda";
import type { ScheduleAgendaInput } from "@/entities/schedule/model/scheduleAgenda.type";
import { DayRoster } from "@/entities/schedule/ui/DayRoster";

export type ScheduleAgendaProps = ScheduleAgendaInput & {
  pending?: ReactNode;
  failed?: (retry: () => void) => ReactNode;
  empty?: ReactNode;
};

export function ScheduleAgenda({
  pending,
  failed,
  empty,
  ...input
}: ScheduleAgendaProps) {
  const agenda = useScheduleAgenda(input);

  return (
    <FragmentView
      fragment={agenda}
      pending={pending}
      failed={(branch) => failed?.(branch.retry)}
      empty={empty}
    >
      {(ready) => (
        <View>
          {ready.days.map((day) => (
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
              <DayRoster rows={day.rows} myProfileId={ready.myProfileId} />
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
      )}
    </FragmentView>
  );
}
