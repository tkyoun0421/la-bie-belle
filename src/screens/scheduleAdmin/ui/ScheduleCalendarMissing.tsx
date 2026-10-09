import { CalendarDays } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import { EMPTY_ICON_SIZE } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";

export type ScheduleCalendarMissingProps = {
  screen: ScheduleAdminScreenController;
};

export function ScheduleCalendarMissing({
  screen,
}: ScheduleCalendarMissingProps) {
  return (
    <View className="items-center gap-6 py-16">
      <Icon icon={CalendarDays} size={EMPTY_ICON_SIZE} />
      <Text size="lg" weight="bold">
        {screen.emptyTitle}
      </Text>
      {screen.canCreate ? (
        <>
          <Text size="sm" tone="muted">
            {screen.createHint}
          </Text>
          <Button
            variant="primary"
            className="self-stretch"
            onPress={screen.openCreateSheet}
          >
            {screen.createLabel}
          </Button>
        </>
      ) : null}
    </View>
  );
}
