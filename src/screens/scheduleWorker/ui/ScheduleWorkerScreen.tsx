import { usePathname, useRouter } from "expo-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
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

/**
 * 근무자가 보는 근무표다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-worker.md`고 완료 조건은
 * `docs/2-design/spec/schedule-worker.md`다.
 *
 * **한 화면이 달의 상태를 탄다.** 확정된 달은 근무표고 확정 전 달은 같은 자리가 제출
 * 모드다 — 별도 제출 화면이 없다. 무엇을 그릴지는
 * [`useScheduleWorkerScreen`](../hooks/useScheduleWorkerScreen.ts)이 `bodyState` 하나로
 * 접어 내고 여기는 그 갈래를 그린다.
 *
 * **시트 겹이 하나다.** 요청·취소·명단 셋이 같은 자리에 서고 어느 얼굴인지는 controller가
 * `sheet.kind`로 말한다 — 날짜 하나에 문이 둘이라 어느 문이 열렸는지가 여기서 갈리면
 * 그 판정이 화면에 남는다.
 *
 * **아직 안 채운 셋.** 인증 상태 열과 현황 줄은 `check_ins` 표가 서는 attendance task 뒤에
 * 차고, 교대 요청 시트는 swap task가 낸다. 달 고르기 시트도 아직이다
 * (`docs/3-build/plans/schedule-worker.md`의 AC-09).
 */

/**
 * 껍데기가 그릴 줄 수다.
 *
 * **같은 값이 저장소 열셋에 쓰는 꼴까지 같다.** 몇 줄인지는 화면이 정하고 `.map`으로 회색
 * 덩이를 그리는 일은 `shared/ui`의 몫이라, 접는 자리가 `consts`가 아닐 수 있다 — AC-13이
 * 받는다.
 */
const SKELETON_ROWS = [0, 1, 2];

/**
 * 보기 전환 표다. 값과 아이콘과 읽어 주는 말이 한 줄로 묶여야 하는데 아이콘이 컴포넌트라
 * `.ts`인 `consts/`가 못 든다 — 반만 옮기면 보기를 하나 더 다는 날 두 자리를 봐야 해서
 * 표째로 여기 남는다.
 */
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
  const screen = useScheduleWorkerScreen(supabase, { month, date });

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
