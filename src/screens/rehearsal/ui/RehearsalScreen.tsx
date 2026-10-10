import { ChevronDown } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { useHardwareBack } from "@/shared/hooks/useHardwareBack";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Dialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { MonthCalendar } from "@/shared/ui/MonthCalendar";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import {
  MONTH_CHEVRON_SIZE,
  MONTH_TEST_ID,
  REHEARSAL_COPY,
  REMOVE_CONFIRM_TEST_ID,
} from "@/screens/rehearsal/consts/rehearsal.const";
import { useRehearsalScreen } from "@/screens/rehearsal/hooks/useRehearsalScreen";
import { RehearsalSheets } from "@/screens/rehearsal/ui/RehearsalSheets";

export type RehearsalScreenProps = {
  month?: string;
};

export function RehearsalScreen({ month: monthParam }: RehearsalScreenProps) {
  const screen = useRehearsalScreen(monthParam);

  useHardwareBack(screen.closeTop);

  return (
    <Screen>
      <AppBar title={REHEARSAL_COPY.appBarTitle} onBack={screen.goBack} />

      <ScrollView>
        <View className="gap-3 px-5 pb-5">
          <View className="h-12 flex-row items-center justify-between gap-3">
            <Pressable
              accessibilityRole="button"
              testID={MONTH_TEST_ID}
              onPress={screen.openPicker}
              className="flex-row items-center gap-1"
            >
              <Text size="base" weight="medium">
                {screen.monthLabel}
              </Text>
              <Icon
                icon={ChevronDown}
                size={MONTH_CHEVRON_SIZE}
                tone="subtle"
              />
            </Pressable>
            <Text size="xs" tone="subtle" numeric>
              {screen.totalLabel}
            </Text>
          </View>

          <Card>
            <MonthCalendar
              month={screen.month}
              stateOf={screen.cellStateOf}
              isToday={screen.isToday}
              canPress={screen.canPressDay}
              onPressDay={screen.openDay}
              noteOf={screen.noteOf}
            />
          </Card>

          <Text size="xs" tone="subtle">
            {REHEARSAL_COPY.legend}
          </Text>

          {screen.failedLine === null ? null : (
            <View className="flex-row items-center gap-2">
              <Text size="xs" tone="subtle">
                {screen.failedLine}
              </Text>
              <Button variant="ghost" size="compact" onPress={screen.retry}>
                {REHEARSAL_COPY.retry}
              </Button>
            </View>
          )}
        </View>
      </ScrollView>

      <RehearsalSheets screen={screen} />

      <Dialog
        visible={screen.removing}
        title={REHEARSAL_COPY.removeTitle}
        closeLabel={REHEARSAL_COPY.removeCancel}
        confirmLabel={REHEARSAL_COPY.removeConfirm}
        confirmTestID={REMOVE_CONFIRM_TEST_ID}
        destructive
        onClose={screen.cancelRemove}
        onConfirm={screen.confirmRemove}
      >
        {REHEARSAL_COPY.removeBody}
      </Dialog>
    </Screen>
  );
}
