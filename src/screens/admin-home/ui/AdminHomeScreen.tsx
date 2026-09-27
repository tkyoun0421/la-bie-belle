import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { supabase } from "@/shared/lib/supabase";
import { AdminSwitch } from "@/shared/ui/AdminSwitch";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { Card, CardHeader } from "@/shared/ui/Card";
import { Divider } from "@/shared/ui/Divider";
import { ListRow } from "@/shared/ui/ListRow";
import { MiniCalendar } from "@/shared/ui/MiniCalendar";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { RatioBand } from "@/shared/ui/RatioBand";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { Text } from "@/shared/ui/Text";
import { liveAssignmentCount } from "@/entities/schedule/dals/get-month-schedule";
import { useMembers } from "@/features/members/model/useMembers";
import { useHallDefaults } from "@/features/schedule/model/useHallDefaults";
import { useMonthSchedule } from "@/features/schedule/model/useMonthSchedule";
import { useMonthWindow } from "@/features/schedule/model/useMonthWindow";
import { useOpenSlots } from "@/features/schedule/model/useOpenSlots";
import { useSetHallDefaults } from "@/features/schedule/model/useSetHallDefaults";
import { homeTileSummary } from "@/screens/admin-home/model/home-tile-summary";
import { miniViewLoads } from "@/screens/admin-home/model/mini-view-density";
import { tileMonth } from "@/screens/admin-home/model/tile-month";
import {
  kstToday,
  spellDate,
  todayBandShares,
  todayStatus,
} from "@/screens/admin-home/model/today-status";
import {
  vacancyCardTitle,
  vacancyCards,
  vacancyDaysLeftLine,
  vacancyDaysOf,
} from "@/screens/admin-home/model/vacancy-cards";
import { HallDefaultsSheet } from "@/screens/admin-home/ui/HallDefaultsSheet";

/**
 * 관리자가 관리자 모드에서 처음 보는 허브다. 정본은
 * `docs/2-design/system/screens/admin-home.md`고 완료 조건은
 * `docs/2-design/spec/schedule-admin.md`의 AC-01이다.
 *
 * **보는 것이 먼저고 하는 것이 뒤다.** 위 묶음(오늘 현황·타일·빈 자리·미니뷰)은 지금 무슨
 * 일이 벌어지는지고, 가운데는 이번 달 근무표를 굴리는 일이고, 아래는 사람과 값과 도구다.
 *
 * **자리가 빠지면 위 간격을 이어받는다.** 오늘 배정이 없으면 오늘 현황이 통째로 없고, 빈
 * 자리가 없으면 그 자리도 없다 — 0으로 서지 않는다.
 *
 * **타일만 다른 달을 말할 수 있다.** 오늘이 든 달이 확정됐으면 타일은 다음 달로 넘어가고
 * ([tile-month.ts](../model/tile-month.ts)) 눌렀을 때 그 달이 열린다. 오늘 현황·빈 자리
 * 카드·미니뷰는 늘 오늘이 든 달이다 — 셋은 지금 벌어지는 일을 보는 자리다.
 *
 * **승인할 일 줄에 건수가 없다.** 사유와 근무 취소 요청을 한 목록으로 세는 손이 아직 없다 —
 * 0으로 적으면 쌓인 것이 없다는 거짓말이 된다(spec 「범위 밖」).
 */

export function AdminHomeScreen() {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  const today = kstToday();
  const month = today.slice(0, 7);

  const { data: schedule } = useMonthWindow(supabase, month);
  const { data: days } = useMonthSchedule(supabase, month);
  const { data: openSlots } = useOpenSlots(supabase, month);
  const { data: defaults } = useHallDefaults(supabase);
  const { data: pending } = useMembers(supabase, "pending");

  const tiled = tileMonth({
    todayMonth: month,
    todayMonthConfirmed: schedule?.confirmedAt != null,
  });

  const { data: tileSchedule } = useMonthWindow(supabase, tiled);
  const { data: tileDays } = useMonthSchedule(supabase, tiled);
  const { data: tileSlots } = useOpenSlots(supabase, tiled);

  const {
    mutate: saveDefaults,
    isPending: savingDefaults,
    isSuccess: savedDefaults,
    isError: saveFailed,
    reset: resetSave,
  } = useSetHallDefaults(supabase);

  useEffect(() => {
    if (savedDefaults) {
      setSheetOpen(false);
      resetSave();
    }
  }, [savedDefaults, resetSave]);

  const openDays = days ?? [];
  const vacancies = openSlots ?? [];
  const confirmed = schedule?.confirmedAt != null;

  const tileVacancies = tileSlots ?? [];

  const summary = homeTileSummary(
    tileSchedule == null
      ? { state: "not_created", month: tiled }
      : tileSchedule.confirmedAt != null
        ? {
            state: "confirmed",
            month: tiled,
            vacancyCount: tileVacancies.length,
          }
        : {
            state: "in_progress",
            month: tiled,
            openDays: (tileDays ?? []).length,
            vacancyCount: tileVacancies.length,
          },
  );

  const todayDay = openDays.find((day) => day.work_date === today) ?? null;

  const status = todayStatus({
    isConfirmed: confirmed,
    assignedCount: todayDay === null ? 0 : liveAssignmentCount(todayDay),
    checkedInCount: todayDay?.check_ins.length ?? 0,
  });

  const cards = confirmed
    ? vacancyCards({
        days: vacancyDaysOf(vacancies),
        now: new Date().toISOString(),
      })
    : [];

  const loads = miniViewLoads(
    openDays.map((day) => ({
      workDate: day.work_date,
      assignedCount: liveAssignmentCount(day),
    })),
  );

  const goMonth = (asked: string) =>
    router.push(`/admin/schedule?month=${asked}`);

  const goDay = (date: string) => router.push(`/admin/schedule?date=${date}`);

  return (
    <Screen>
      <AppBar
        kind="hub"
        title="관리자"
        right={
          <View className="flex-row items-center gap-1">
            <BellIcon onPress={() => router.push("/notifications")} />
            <AdminSwitch
              destination="worker"
              onPress={() => router.push("/")}
            />
          </View>
        }
      />

      <ScrollView>
        <View className="px-5 pb-8">
          {status.kind === "none" ? null : (
            <Pressable
              testID="admin-home-today-status"
              accessibilityRole="button"
              className="mt-2 py-1"
              onPress={() => goDay(today)}
            >
              <Text size="sm" tone="subtle">
                {spellDate(today)}
              </Text>

              {status.kind === "unconfirmed" ? (
                <Text size="xl" weight="bold" numeric className="mt-1">
                  –
                </Text>
              ) : (
                <>
                  <Text size="xl" weight="bold" numeric className="mt-1">
                    {`${status.assignedCount}명`}
                  </Text>

                  {status.notCheckedInCount === 0 ? (
                    <Text size="sm" tone="muted" className="mt-1">
                      전원 출근했어요
                    </Text>
                  ) : null}

                  <View className="mt-3">
                    <RatioBand
                      shares={todayBandShares(
                        status.checkedInCount,
                        status.notCheckedInCount,
                      )}
                    />
                  </View>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            className="mt-6"
            onPress={() => goMonth(tiled)}
          >
            <Card>
              <CardHeader title="근무표 관리" />
              <Text size="sm" tone="muted" numeric className="mt-1">
                {summary}
              </Text>
            </Card>
          </Pressable>

          {cards.map((card, at) => (
            <Pressable
              key={card.workDate}
              accessibilityRole="button"
              className={at === 0 ? "mt-3" : "mt-2"}
              onPress={() => goDay(card.workDate)}
            >
              <NoticeBlock kind="warning">
                <Text size="sm" weight="medium">
                  {vacancyCardTitle(card)}
                </Text>
                {"\n"}
                <Text size="sm" tone="muted">
                  {vacancyDaysLeftLine(card.daysLeft)}
                </Text>
              </NoticeBlock>
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            className="mt-6"
            onPress={() => goMonth(month)}
          >
            <Text size="sm" tone="subtle">
              {`${Number(month.slice(5))}월`}
            </Text>
            <View className="mt-2">
              <MiniCalendar
                year={Number(month.slice(0, 4))}
                month={Number(month.slice(5))}
                today={new Date()}
                days={loads}
              />
            </View>
          </Pressable>

          <Divider className="mt-6" />

          <ListRow
            title="근무 시간 기본값"
            value={
              defaults === undefined
                ? undefined
                : `${defaults.default_starts.slice(0, 5)}–${defaults.default_ends.slice(0, 5)}`
            }
            onPress={() => setSheetOpen(true)}
          />
          <ListRow
            title="승인할 일"
            onPress={() => router.push("/admin/approvals")}
          />
          <ListRow
            title="가입 대기"
            value={pending === undefined ? undefined : `${pending.length}명`}
            onPress={() => router.push("/admin/members/pending")}
          />

          <Divider />

          <ListRow title="직원" onPress={() => router.push("/admin/members")} />
          <ListRow title="시급" onPress={() => router.push("/admin/wages")} />
          <ListRow title="QR" onPress={() => router.push("/admin/qr")} />
          <ListRow title="통계" onPress={() => router.push("/admin/stats")} />
        </View>
      </ScrollView>

      {sheetOpen && defaults !== undefined ? (
        <SheetLayer onDismiss={() => setSheetOpen(false)}>
          <HallDefaultsSheet
            starts={defaults.default_starts.slice(0, 5)}
            ends={defaults.default_ends.slice(0, 5)}
            saving={savingDefaults}
            failed={saveFailed}
            onClose={() => setSheetOpen(false)}
            onSave={({ starts, ends }) =>
              saveDefaults({ slots: defaults.default_slots, starts, ends })
            }
          />
        </SheetLayer>
      ) : null}
    </Screen>
  );
}
