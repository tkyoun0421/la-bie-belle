import { Pressable, View } from "react-native";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";
import { SCHEDULE_ADMIN_COPY } from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import type { ScheduleAdminScreenController } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";

export type ScheduleAdminBottomCtaProps = {
  screen: ScheduleAdminScreenController;
};

export function ScheduleAdminBottomCta({
  screen,
}: ScheduleAdminBottomCtaProps) {
  if (screen.picking) {
    return (
      <BottomCTA>
        <Button
          variant="primary"
          loading={screen.opening}
          disabled={!screen.canOpenDays}
          onPress={() => void screen.openPickedDays()}
        >
          {screen.openDaysLabel}
        </Button>
      </BottomCTA>
    );
  }

  if (!screen.showConfirmCta) {
    return null;
  }

  return (
    <BottomCTA
      note={
        screen.confirmUnlockLine === null ? undefined : (
          <View className="flex-row items-center justify-center gap-1">
            <Text size="xs" tone="subtle" numeric>
              {screen.confirmUnlockLine}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={screen.openDeadlineSheet}
            >
              <Text size="xs" tone="muted">
                {SCHEDULE_ADMIN_COPY.pullDeadline}
              </Text>
            </Pressable>
          </View>
        )
      }
    >
      <Button
        variant="primary"
        disabled={screen.confirmLocked}
        onPress={screen.openConfirmSheet}
      >
        {screen.confirmLabel}
      </Button>
    </BottomCTA>
  );
}
