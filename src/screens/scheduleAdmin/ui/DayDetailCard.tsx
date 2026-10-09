import { View } from "react-native";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { Switch } from "@/shared/ui/Switch";
import { Text } from "@/shared/ui/Text";
import { SCHEDULE_ADMIN_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type { DayDetailController } from "@/screens/scheduleAdmin/model/dayDetail.type";

export const SCHEDULE_HOLIDAY_SWITCH_TEST_ID = "schedule-holiday-switch";

export type DayDetailCardProps = {
  day: DayDetailController;
  onPressHours: () => void;
  onSetHoliday: (on: boolean) => void;
};

export function DayDetailCard({
  day,
  onPressHours,
  onSetHoliday,
}: DayDetailCardProps) {
  return (
    <Card className="py-0">
      {day.showHours ? (
        <ListRow title={day.hoursLine} onPress={onPressHours} />
      ) : null}

      <View className="flex-row items-center gap-3 py-3">
        <View className="flex-1">
          <Text size="base" weight="medium">
            {SCHEDULE_ADMIN_COPY.holidayLabel}
          </Text>
          <Text size="xs" tone="subtle" className="mt-0.5">
            {day.holiday.helperLine}
          </Text>
        </View>
        <Switch
          testID={SCHEDULE_HOLIDAY_SWITCH_TEST_ID}
          value={day.holiday.checked}
          disabled={day.holiday.locked}
          onValueChange={onSetHoliday}
        />
      </View>

      <ListRow
        title={SCHEDULE_ADMIN_COPY.adjustLabel}
        right={
          <Text size="xs" tone="subtle" numeric>
            {day.adjustmentLine}
          </Text>
        }
        chevron
        className="py-3"
        onPress={day.openAdjust}
      />

      {day.showApplications ? (
        <ListRow title={day.applicationsLine} chevron={false} />
      ) : null}
    </Card>
  );
}
