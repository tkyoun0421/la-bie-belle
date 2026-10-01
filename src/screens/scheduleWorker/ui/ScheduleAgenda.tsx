import { View } from "react-native";
import { AccordionRow } from "@/shared/ui/Accordion";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Text } from "@/shared/ui/Text";
import {
  agendaRowStatusLabel,
  spellWorkDate,
  type MyAssignment,
} from "@/screens/scheduleWorker/model/agendaRow";
import type { RosterRow as RosterRowValue } from "@/screens/scheduleWorker/model/daySheet";
import { DayRoster } from "@/screens/scheduleWorker/ui/DayRoster";

/**
 * 포지션 순 보기다. 열린 날이 날짜순 아코디언으로 서고 기본은 전부 접힘이다
 * (`docs/2-design/modules/schedule/screens/scheduleWorker.md`의 「포지션 순 — 날짜
 * 아코디언」).
 *
 * 현황 줄은 여기서 안 선다 — 날짜 줄이 이미 그 자리를 쓴다.
 */

export type AgendaEntry = {
  workDate: string;
  myAssignment: MyAssignment | null;
  rows: RosterRowValue[];
  showActions: boolean;
};

export type ScheduleAgendaProps = {
  entries: AgendaEntry[];
  expanded: string[];
  myProfileId: string | null;
  onToggle: (workDate: string) => void;
  onCancelShift: (workDate: string) => void;
  onRequestSwap: (workDate: string) => void;
};

export function ScheduleAgenda({
  entries,
  expanded,
  myProfileId,
  onToggle,
  onCancelShift,
  onRequestSwap,
}: ScheduleAgendaProps) {
  if (entries.length === 0) {
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
      {entries.map((entry, at) => (
        <AccordionRow
          key={entry.workDate}
          divider={at > 0}
          title={spellWorkDate(entry.workDate)}
          expanded={expanded.includes(entry.workDate)}
          onToggle={() => onToggle(entry.workDate)}
          status={
            <Text
              size="xs"
              tone={entry.myAssignment === null ? "subtle" : "brand"}
            >
              {agendaRowStatusLabel(entry.myAssignment)}
            </Text>
          }
        >
          <DayRoster rows={entry.rows} myProfileId={myProfileId} />
          {entry.showActions ? (
            <View className="mt-3 flex-row gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={() => onCancelShift(entry.workDate)}
              >
                근무 취소
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onPress={() => onRequestSwap(entry.workDate)}
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
