import { usePathname, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { NO_VALUE } from "@/shared/consts/noValue.const";
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
import { ADMIN_HOME_COPY } from "@/screens/adminHome/consts/adminHome.const";
import { useAdminHomeScreen } from "@/screens/adminHome/hooks/useAdminHomeScreen";
import { HallDefaultsSheet } from "@/screens/adminHome/ui/HallDefaultsSheet";

/**
 * 관리자가 관리자 모드에서 처음 보는 허브다. 정본은
 * `docs/2-design/system/screens/adminHome.md`고 완료 조건은
 * `docs/2-design/spec/schedule-admin.md`의 AC-01이다.
 *
 * **보는 것이 먼저고 하는 것이 뒤다.** 위 묶음(오늘 현황·타일·빈 자리·미니뷰)은 지금 무슨
 * 일이 벌어지는지고, 가운데는 이번 달 근무표를 굴리는 일이고, 아래는 사람과 값과 도구다.
 *
 * **자리가 빠지면 위 간격을 이어받는다.** 오늘 배정이 없으면 오늘 현황이 통째로 없고, 빈
 * 자리가 없으면 그 자리도 없다 — 0으로 서지 않는다.
 *
 * **타일만 다른 달을 말할 수 있다.** 어느 달이 서는지와 그 달을 어떻게 읽는지는
 * [`useAdminHomeScreen`](../hooks/useAdminHomeScreen.ts)이 가른다 — 이 파일이 받는 것은
 * 「타일이 말하는 달」 하나다.
 *
 * **보낼 데만 여기 산다.** 종과 모드 바꾸기와 줄마다의 이동이 `expo-router`를 쥐고, 그릴
 * 값은 전부 controller가 이미 글자로 만들어 온다.
 */

export function AdminHomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const screen = useAdminHomeScreen(supabase);

  const goMonth = (asked: string) =>
    router.push(`/admin/schedule?month=${asked}`);

  const goDay = (date: string) => router.push(`/admin/schedule?date=${date}`);

  return (
    <Screen>
      <AppBar
        kind="hub"
        title={ADMIN_HOME_COPY.appBarTitle}
        right={
          <View className="flex-row items-center gap-1">
            <BellIcon
              testID="bell-icon"
              unread={screen.unread}
              onPress={() => router.push(`/notifications?from=${pathname}`)}
            />
            <AdminSwitch
              destination="worker"
              onPress={() => router.push("/")}
            />
          </View>
        }
      />

      <ScrollView>
        <View className="px-5 pb-8">
          {screen.status.kind === "none" ? null : (
            <Pressable
              testID="admin-home-today-status"
              accessibilityRole="button"
              className="mt-2 py-1"
              onPress={() => goDay(screen.today)}
            >
              <Text size="sm" tone="subtle">
                {screen.todayLabel}
              </Text>

              {screen.status.kind === "unconfirmed" ? (
                <Text size="xl" weight="bold" numeric className="mt-1">
                  {NO_VALUE}
                </Text>
              ) : (
                <>
                  <Text size="xl" weight="bold" numeric className="mt-1">
                    {`${screen.status.assignedCount}${ADMIN_HOME_COPY.assignedSuffix}`}
                  </Text>

                  {screen.status.notCheckedInCount === 0 ? (
                    <Text size="sm" tone="muted" className="mt-1">
                      {ADMIN_HOME_COPY.allCheckedIn}
                    </Text>
                  ) : null}

                  <View className="mt-3">
                    <RatioBand shares={screen.bandShares} />
                  </View>
                </>
              )}
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            className="mt-6"
            onPress={() => goMonth(screen.tileMonth)}
          >
            <Card>
              <CardHeader title={ADMIN_HOME_COPY.scheduleTile} />
              <Text size="sm" tone="muted" numeric className="mt-1">
                {screen.summary}
              </Text>
            </Card>
          </Pressable>

          {screen.cards.map((card, at) => (
            <Pressable
              key={card.workDate}
              accessibilityRole="button"
              className={at === 0 ? "mt-3" : "mt-2"}
              onPress={() => goDay(card.workDate)}
            >
              <NoticeBlock kind="warning">
                <Text size="sm" weight="medium">
                  {card.title}
                </Text>
                {"\n"}
                <Text size="sm" tone="muted">
                  {card.daysLeftLine}
                </Text>
              </NoticeBlock>
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            className="mt-6"
            onPress={() => goMonth(screen.month)}
          >
            <Text size="sm" tone="subtle">
              {screen.monthLabel}
            </Text>
            <View className="mt-2">
              <MiniCalendar
                year={screen.miniYear}
                month={screen.miniMonth}
                today={screen.miniToday}
                days={screen.loads}
              />
            </View>
          </Pressable>

          <Divider className="mt-6" />

          <ListRow
            title={ADMIN_HOME_COPY.defaultsRow}
            value={screen.defaultsValue}
            onPress={screen.openSheet}
          />
          <ListRow
            title={screen.approvalsTitle}
            onPress={() => router.push("/admin/approvals")}
          />
          <ListRow
            title={ADMIN_HOME_COPY.pendingRow}
            value={screen.pendingValue}
            onPress={() => router.push("/admin/members/pending")}
          />

          <Divider />

          <ListRow
            title={ADMIN_HOME_COPY.membersRow}
            onPress={() => router.push("/admin/members")}
          />
          <ListRow
            title={ADMIN_HOME_COPY.wagesRow}
            onPress={() => router.push("/admin/wages")}
          />
          <ListRow
            title={ADMIN_HOME_COPY.qrRow}
            onPress={() => router.push("/admin/qr")}
          />
          <ListRow
            title={ADMIN_HOME_COPY.statsRow}
            onPress={() => router.push("/admin/stats")}
          />
        </View>
      </ScrollView>

      {screen.sheet === null ? null : (
        <SheetLayer onDismiss={screen.closeSheet}>
          <HallDefaultsSheet
            starts={screen.sheet.starts}
            ends={screen.sheet.ends}
            saving={screen.saving}
            failed={screen.saveFailed}
            onStarts={screen.writeStarts}
            onEnds={screen.writeEnds}
            onClose={screen.closeSheet}
            onSave={screen.saveDefaults}
          />
        </SheetLayer>
      )}
    </Screen>
  );
}
