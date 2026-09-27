import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import {
  dayApplicationsLine,
  dayDetailRows,
} from "@/screens/schedule-admin/model/day-detail-rows";
import { dayHoursLine } from "@/screens/schedule-admin/model/day-hours-form";
import { formatScheduleDate } from "@/screens/schedule-admin/model/format-schedule-date";

/**
 * 열린 날 하나의 상세다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「날 상세 짜임」이다.
 *
 * **이 task가 그리는 것은 껍데기까지다.** 근무 시간 줄과 근무 신청 줄, 그리고 확정 전의
 * 「이 날 닫기」뿐이다 — 포지션 아홉 줄과 자리·배정·사람 픽커는 `schedule-assign`이,
 * 임시공휴일 줄과 근무 조정 줄은 `payroll-adjust`가 더한다(spec 「범위 밖」).
 *
 * **근무 신청이 0건이면 줄이 통째로 없다.** 「0명 신청」을 적으면 읽을 것이 있는 줄처럼
 * 보인다.
 */

export type DayDetailProps = {
  workDate: string;
  startsAt: string;
  endsAt: string;
  filledCount: number;
  slotCount: number;
  applicationNames: readonly string[];
  isConfirmed: boolean;
  onBack: () => void;
  onPressHours: () => void;
  onCloseDay: () => void;
};

export function DayDetail({
  workDate,
  startsAt,
  endsAt,
  filledCount,
  slotCount,
  applicationNames,
  isConfirmed,
  onBack,
  onPressHours,
  onCloseDay,
}: DayDetailProps) {
  const rows = dayDetailRows({ applicationCount: applicationNames.length });

  return (
    <>
      <AppBar
        title={formatScheduleDate(workDate)}
        onBack={onBack}
        right={
          <Text size="sm" tone="muted" numeric>
            {`${filledCount}/${slotCount}`}
          </Text>
        }
      />

      <ScrollView>
        <View className="gap-3 px-5 pb-8">
          <Card className="py-0">
            {rows.map((row) =>
              row === "hours" ? (
                <ListRow
                  key={row}
                  title={dayHoursLine(startsAt, endsAt)}
                  onPress={onPressHours}
                />
              ) : (
                <ListRow
                  key={row}
                  title={dayApplicationsLine(applicationNames)}
                  chevron={false}
                />
              ),
            )}
          </Card>

          {isConfirmed ? null : (
            <Button variant="secondary" onPress={onCloseDay}>
              이 날 닫기
            </Button>
          )}
        </View>
      </ScrollView>
    </>
  );
}
