import { View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { SCHEDULE_ADMIN_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";

export type SchedulePickingAppBarProps = {
  onStop: () => void;
};

export function SchedulePickingAppBar({ onStop }: SchedulePickingAppBarProps) {
  return (
    <AppBar
      title={
        <View className="flex-row items-center gap-2">
          <Button variant="ghost" size="compact" onPress={onStop}>
            {SCHEDULE_ADMIN_COPY.stopPicking}
          </Button>
          <Text size="lg" weight="semibold">
            {SCHEDULE_ADMIN_COPY.pickingTitle}
          </Text>
        </View>
      }
    />
  );
}
