import { usePathname, useRouter } from "expo-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { useHardwareBack } from "@/shared/hooks/useHardwareBack";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Checkbox } from "@/shared/ui/Checkbox";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { MonthCalendar } from "@/shared/ui/MonthCalendar";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { SCHEDULE_WORKER_COPY } from "@/screens/scheduleWorker/consts/scheduleWorker.const";
import { useScheduleWorkerScreen } from "@/screens/scheduleWorker/hooks/useScheduleWorkerScreen";
import { CancelShiftSheet } from "@/screens/scheduleWorker/ui/CancelShiftSheet";
import { DaySheet } from "@/screens/scheduleWorker/ui/DaySheet";
import { RequestSheet } from "@/screens/scheduleWorker/ui/RequestSheet";
import { ScheduleAgenda } from "@/screens/scheduleWorker/ui/ScheduleAgenda";

const SKELETON_ROWS = [0, 1, 2];

const VIEW_OPTIONS = [
  {
    value: "calendar",
    icon: CalendarDays,
    accessibilityLabel: SCHEDULE_WORKER_COPY.calendarView,
  },
  {
    value: "position",
    icon: List,
    accessibilityLabel: SCHEDULE_WORKER_COPY.positionView,
  },
];

export type ScheduleWorkerScreenProps = {
  month?: string;
  date?: string;
};

export function ScheduleWorkerScreen({
  month,
  date,
}: ScheduleWorkerScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const screen = useScheduleWorkerScreen({ month, date });

  useHardwareBack(screen.closeTop);

  const calendar = (
    <Card>
      <MonthCalendar
        month={screen.month}
        stateOf={screen.cellStateOf}
        isToday={screen.isToday}
        canPress={screen.canPressDay}
        onPressDay={screen.pressDay}
      />
    </Card>
  );

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
            onPress={() => router.push(`/notifications?from=${pathname}`)}
          />
        }
      />

      <ScrollView>
        <View className="gap-3 px-5 pb-5">
          {screen.bodyState === "loading" ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : screen.bodyState === "confirmed" ? (
            <>
              <View className="flex-row items-center justify-between gap-3 py-1">
                <Segment
                  options={VIEW_OPTIONS}
                  value={screen.view}
                  onChange={screen.showView}
                  className="flex-1"
                />
                <Checkbox
                  label={SCHEDULE_WORKER_COPY.mineOnly}
                  checked={screen.showMineOnly}
                  onCheckedChange={screen.showMine}
                />
              </View>

              {screen.view === "position" ? (
                <Card className="py-0">
                  <ScheduleAgenda
                    entries={screen.agendaEntries}
                    expanded={screen.expanded}
                    myProfileId={screen.myProfileId}
                    onToggle={screen.toggleAgendaDay}
                    onCancelShift={screen.askCancelOn}
                    onRequestSwap={screen.requestSwap}
                  />
                </Card>
              ) : (
                calendar
              )}

              <Text size="xs" tone="subtle">
                {screen.calendarNote}
              </Text>
            </>
          ) : (
            <>
              {screen.deadlineLine === null ? null : (
                <Text size="xs" tone="subtle" numeric className="py-1">
                  {screen.deadlineLine}
                </Text>
              )}

              {calendar}

              {screen.notice === null ? null : (
                <Text size="sm" tone="muted">
                  {screen.notice}
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {screen.bodyState === "collecting" ? (
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

      {screen.sheet === null ? null : (
        <SheetLayer onDismiss={screen.closeSheet}>
          {screen.sheet.kind === "request" ? (
            <RequestSheet
              subtitle={screen.sheet.subtitle}
              state={screen.sheet.state}
              sending={screen.sheet.sending}
              failed={screen.sheet.failed}
              onDecline={screen.decline}
              onAccept={screen.accept}
            />
          ) : screen.sheet.kind === "cancel" ? (
            <CancelShiftSheet
              title={screen.sheet.title}
              reason={screen.sheet.reason}
              canSend={screen.sheet.canSend}
              sending={screen.sheet.sending}
              failed={screen.sheet.failed}
              onChangeReason={screen.writeReason}
              onSend={screen.sendCancel}
            />
          ) : (
            <DaySheet
              title={screen.sheet.title}
              subtitle={screen.sheet.subtitle}
              rows={screen.sheet.rows}
              myProfileId={screen.sheet.myProfileId}
              myBadge={screen.sheet.myBadge}
              showActions={screen.sheet.showActions}
              actionsEnabled={screen.sheet.actionsEnabled}
              onCancelShift={screen.askCancel}
              onRequestSwap={screen.requestSwap}
            />
          )}
        </SheetLayer>
      )}

      {screen.toast === null ? null : (
        <FloatingToast
          kind="success"
          message={screen.toast}
          onDone={screen.dismissToast}
        />
      )}
    </Screen>
  );
}
