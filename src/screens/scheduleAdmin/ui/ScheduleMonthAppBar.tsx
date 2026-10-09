import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { SCHEDULE_ADMIN_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";

export type ScheduleMonthAppBarProps = {
  screen: ScheduleAdminScreenController;
};

export function ScheduleMonthAppBar({ screen }: ScheduleMonthAppBarProps) {
  return (
    <AppBar
      onBack={screen.goBack}
      title={
        <View className="flex-row items-center gap-1">
          <Button
            variant="ghost"
            size="compact"
            square
            testID="schedule-month-prev"
            onPress={screen.goPrevMonth}
          >
            <Icon icon={ChevronLeft} />
          </Button>
          <Text size="lg" weight="semibold">
            {screen.monthTitle}
          </Text>
          <Button
            variant="ghost"
            size="compact"
            square
            testID="schedule-month-next"
            onPress={screen.goNextMonth}
          >
            <Icon icon={ChevronRight} />
          </Button>
          {screen.confirmed ? (
            <Badge label={SCHEDULE_ADMIN_COPY.confirmedBadge} />
          ) : null}
        </View>
      }
      right={
        screen.canPickDays ? (
          <Button variant="ghost" size="compact" onPress={screen.startPicking}>
            {SCHEDULE_ADMIN_COPY.startPicking}
          </Button>
        ) : undefined
      }
    />
  );
}
