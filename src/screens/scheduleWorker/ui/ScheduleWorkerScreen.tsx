import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { useHardwareBack } from "@/shared/hooks/useHardwareBack";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { Button } from "@/shared/ui/Button";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { Screen } from "@/shared/ui/Screen";
import { SkeletonRows } from "@/shared/ui/SkeletonRows";
import { Text } from "@/shared/ui/Text";
import {
  SCHEDULE_WORKER_COPY,
  SKELETON_ROWS,
} from "@/screens/scheduleWorker/consts/scheduleWorker.const";
import { useScheduleWorkerScreen } from "@/screens/scheduleWorker/hooks/useScheduleWorkerScreen";
import { ScheduleWorkerPicker } from "@/screens/scheduleWorker/ui/ScheduleWorkerPicker";
import { ScheduleWorkerRoster } from "@/screens/scheduleWorker/ui/ScheduleWorkerRoster";
import { ScheduleWorkerSheets } from "@/screens/scheduleWorker/ui/ScheduleWorkerSheets";

export type ScheduleWorkerScreenProps = {
  month?: string;
  date?: string;
};

export function ScheduleWorkerScreen({
  month,
  date,
}: ScheduleWorkerScreenProps) {
  const screen = useScheduleWorkerScreen({ month, date });

  useHardwareBack(screen.closeTop);

  return (
    <Screen>
      <AppBar
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
          </View>
        }
        right={
          <BellIcon
            testID="bell-icon"
            unread={screen.unread}
            onPress={screen.goNotifications}
          />
        }
      />

      <ScrollView>
        <View className="gap-3 px-5 pb-5">
          {screen.body.state === "pending" ? (
            <SkeletonRows rows={SKELETON_ROWS} frame="card" />
          ) : null}

          {screen.body.state === "ready" && screen.body.kind === "confirmed" ? (
            <ScheduleWorkerRoster screen={screen} />
          ) : null}

          {screen.body.state === "ready" && screen.body.kind === "picker" ? (
            <ScheduleWorkerPicker screen={screen} />
          ) : null}
        </View>
      </ScrollView>

      {screen.body.state === "ready" && screen.body.month === "collecting" ? (
        <BottomCTA>
          <Button
            variant="primary"
            loading={screen.sending}
            onPress={screen.submit}
          >
            {SCHEDULE_WORKER_COPY.submit}
          </Button>
        </BottomCTA>
      ) : null}

      <ScheduleWorkerSheets screen={screen} />

      {screen.toast === null ? null : (
        <FloatingToast
          kind={screen.toast.kind}
          message={screen.toast.message}
          onDone={screen.dismissToast}
        />
      )}
    </Screen>
  );
}
