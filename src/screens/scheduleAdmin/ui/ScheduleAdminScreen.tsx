import { useRouter } from "expo-router";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { ORIGIN_NOTIFICATIONS } from "@/shared/consts/navigation.const";
import { AppBar } from "@/shared/ui/AppBar";
import { Badge } from "@/shared/ui/Badge";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { ListRow } from "@/shared/ui/ListRow";
import { MonthCalendar } from "@/shared/ui/MonthCalendar";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { DeadlineSheet } from "@/features/availabilitySubmit/ui/DeadlineSheet";
import {
  EMPTY_ICON_SIZE,
  ORIGIN_APPROVALS,
  SCHEDULE_ADMIN_COPY,
} from "@/screens/scheduleAdmin/consts/scheduleAdmin.const";
import { useScheduleAdminScreen } from "@/screens/scheduleAdmin/hooks/useScheduleAdminScreen";
import { CloseDayWarningSheet } from "@/screens/scheduleAdmin/ui/CloseDayWarningSheet";
import { ConfirmSheet } from "@/screens/scheduleAdmin/ui/ConfirmSheet";
import { CreateScheduleSheet } from "@/screens/scheduleAdmin/ui/CreateScheduleSheet";
import { DayDetail } from "@/screens/scheduleAdmin/ui/DayDetail";
import { DayHoursSheet } from "@/screens/scheduleAdmin/ui/DayHoursSheet";

/**
 * 관리자가 근무표를 짜는 화면이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`고 완료 조건은
 * `docs/2-design/spec/schedule-admin.md`다.
 *
 * **한 라우트가 달력과 날 상세를 둘 다 든다.** `?date=`가 있으면 그 날의 상세고 없으면
 * 달력이다 — 알림과 관리자 홈이 날짜로 바로 들어오는 자리라 문이 하나여야 한다
 * (`docs/2-design/system/navigation.md`의 「경로」). 어느 쪽을 그릴지와 날 상세가 쓸 묶음은
 * [`useScheduleAdminScreen`](../hooks/useScheduleAdminScreen.ts)이 들고 이 파일은 쌓기만 한다.
 *
 * **`?from=`은 앱바 뒤로가 어디로 가는지를 정한다.** 승인할 일에서 근무 취소를 승인하면 그
 * 자리를 채우러 여기로 오고, 알림 목록에서 와도 같은 자리다
 * ([navigation.md 「뒤로」](../../../../docs/2-design/system/navigation.md#뒤로)) — 이동이라
 * 이 파일이 쥔다. 닿아서 띄울 토스트는 controller 것이다.
 */

const SKELETON_ROWS = [0, 1, 2];

export type ScheduleAdminScreenProps = {
  month?: string;
  date?: string;
  from?: string;
};

export function ScheduleAdminScreen({
  month,
  date,
  from,
}: ScheduleAdminScreenProps) {
  const router = useRouter();
  const screen = useScheduleAdminScreen(supabase, { month, date, from });

  const toast =
    screen.toast === null ? null : (
      <FloatingToast
        kind={screen.toast.kind}
        message={screen.toast.message}
        onDone={screen.dismissToast}
      />
    );

  if (screen.day !== null) {
    return (
      <Screen>
        <DayDetail
          {...screen.day}
          onBack={() => {
            if (from === ORIGIN_APPROVALS) {
              router.replace("/admin/approvals");
              return;
            }

            if (from === ORIGIN_NOTIFICATIONS) {
              router.replace("/notifications");
              return;
            }

            screen.leaveDay();
          }}
        />

        {screen.sheet?.kind === "hours" ? (
          <SheetLayer onDismiss={screen.closeSheet}>
            <DayHoursSheet
              starts={screen.sheet.starts}
              ends={screen.sheet.ends}
              canSave={screen.sheet.canSave}
              saving={screen.sheet.saving}
              failed={screen.sheet.failed}
              onWriteStarts={screen.writeHoursStarts}
              onWriteEnds={screen.writeHoursEnds}
              onClose={screen.closeSheet}
              onSave={screen.saveHours}
            />
          </SheetLayer>
        ) : null}

        {screen.sheet?.kind === "close" ? (
          <SheetLayer onDismiss={screen.closeSheet}>
            <CloseDayWarningSheet
              workDate={screen.sheet.workDate}
              assignmentCount={screen.sheet.assignmentCount}
              closing={screen.sheet.closing}
              onCancel={screen.closeSheet}
              onConfirm={screen.closeDay}
            />
          </SheetLayer>
        ) : null}

        {toast}
      </Screen>
    );
  }

  return (
    <Screen>
      {screen.picking ? (
        <AppBar
          title={
            <View className="flex-row items-center gap-2">
              <Button
                variant="ghost"
                size="compact"
                onPress={screen.stopPicking}
              >
                {SCHEDULE_ADMIN_COPY.stopPicking}
              </Button>
              <Text size="lg" weight="semibold">
                {SCHEDULE_ADMIN_COPY.pickingTitle}
              </Text>
            </View>
          }
        />
      ) : (
        <AppBar
          onBack={() => router.back()}
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
              <Button
                variant="ghost"
                size="compact"
                onPress={screen.startPicking}
              >
                {SCHEDULE_ADMIN_COPY.startPicking}
              </Button>
            ) : undefined
          }
        />
      )}

      <ScrollView>
        <View className="gap-3 px-5 pb-8">
          {screen.listState === "loading" ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : screen.listState === "missing" ? (
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
          ) : (
            <>
              {screen.picking ? (
                <Text size="xs" tone="subtle">
                  {SCHEDULE_ADMIN_COPY.pickingHint}
                </Text>
              ) : screen.noticeLine === null ? null : (
                <Text size="xs" tone="subtle" numeric>
                  {screen.noticeLine}
                </Text>
              )}

              {screen.showAllClosedHint ? (
                <Text size="sm" tone="muted">
                  {SCHEDULE_ADMIN_COPY.allClosed}
                </Text>
              ) : null}

              <Card>
                <MonthCalendar
                  month={screen.month}
                  isToday={screen.calendar.isToday}
                  stateOf={screen.calendar.stateOf}
                  canPress={screen.calendar.canPress}
                  onPressDay={screen.calendar.press}
                  applicationCountOf={screen.calendar.applicationCountOf}
                  vacancyCountOf={screen.calendar.vacancyCountOf}
                />
              </Card>

              {screen.showApplications ? (
                <>
                  <Text size="xs" tone="subtle">
                    {SCHEDULE_ADMIN_COPY.applicationsHint}
                  </Text>

                  <Card className="py-0">
                    <ListRow
                      title={screen.applicationsTitle}
                      onPress={() =>
                        router.push(`/admin/applications?month=${screen.month}`)
                      }
                    />
                  </Card>
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {screen.picking ? (
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
      ) : screen.showConfirmCta ? (
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
      ) : null}

      {screen.sheet?.kind === "create" ? (
        <SheetLayer onDismiss={screen.closeSheet}>
          <CreateScheduleSheet
            month={screen.month}
            today={screen.today}
            deadline={screen.sheet.deadline}
            canSave={screen.sheet.canSave}
            saving={screen.sheet.saving}
            failed={screen.sheet.failed}
            onWriteDeadline={screen.writeCreateDeadline}
            onClose={screen.closeSheet}
            onCreate={screen.createSchedule}
          />
        </SheetLayer>
      ) : null}

      {screen.sheet?.kind === "deadline" ? (
        <SheetLayer onDismiss={screen.closeSheet}>
          <DeadlineSheet
            deadline={screen.sheet.deadline}
            today={screen.today}
            saving={screen.sheet.saving}
            failed={screen.sheet.failed}
            onClose={screen.closeSheet}
            onSave={screen.saveDeadline}
          />
        </SheetLayer>
      ) : null}

      {screen.sheet?.kind === "confirm" ? (
        <SheetLayer onDismiss={screen.closeSheet}>
          <ConfirmSheet
            month={screen.month}
            openSlots={screen.sheet.openSlots}
            notifiedCount={screen.sheet.notifiedCount}
            confirming={screen.sheet.confirming}
            done={screen.sheet.done}
            failed={screen.sheet.failed}
            onClose={screen.closeSheet}
            onConfirm={screen.confirmMonth}
          />
        </SheetLayer>
      ) : null}

      {toast}
    </Screen>
  );
}
