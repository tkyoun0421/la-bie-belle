import { usePathname, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import {
  NEXT_PERIOD_TEST_ID,
  PAYROLL_COPY,
  PREV_PERIOD_TEST_ID,
  SEGMENT_TEST_ID,
  UNIT_OPTIONS,
} from "@/screens/payroll/consts/payroll.const";
import { usePayrollScreen } from "@/screens/payroll/hooks/usePayrollScreen";

/**
 * 근무자가 자기 급여를 미리 보는 화면이다. 정본은
 * `docs/2-design/modules/payroll/screens/payroll.md`고 완료 조건은
 * `docs/2-design/spec/payroll-view.md`다.
 *
 * **금액도 기간도 여기서 안 낸다.** 질의 다섯과 조립과 기간 옮기기가
 * [`usePayrollScreen`](../hooks/usePayrollScreen.ts)에 산다 — 이 파일이 받는 것은 그릴 문구와
 * 줄 목록이다.
 *
 * **퇴사한 사람도 이 화면을 본다**([ACC-011](../../../../docs/2-design/modules/account/README.md#acc-011)).
 * 탭 바를 지우는 것은 탭 껍데기의 일이라 `src/app/(tabs)/_layout.tsx`가 맡고, 여기는 앱바의
 * 뒤로와 종 아이콘만 그 사람에 맞춰 바꾼다 — 퇴사한 뒤로는 알림이 안 온다. **그 둘이 이동이라
 * `.tsx`에 남는다** — controller가 내는 것은 「퇴사했나」와 「안 읽은 것이 있나」다.
 *
 * **`useState`가 하나도 없다.** 고른 단위와 보던 날짜가 읽는 달을 바꿔 통신을 움직인다.
 */

const SKELETON_ROWS = [0, 1, 2];

/** 못 가는 화살표는 안 그린다. 기간 글이 가운데에 그대로 서게 자리만 남긴다. */
function ArrowSlot() {
  return <View className="h-8 w-8" />;
}

export function PayrollScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const screen = usePayrollScreen(supabase);

  return (
    <Screen floor="plain">
      <AppBar
        title={PAYROLL_COPY.appBarTitle}
        onBack={screen.hasLeft ? () => router.replace("/left") : undefined}
        right={
          screen.hasLeft ? undefined : (
            <BellIcon
              testID="bell-icon"
              unread={screen.unread}
              onPress={() => router.push(`/notifications?from=${pathname}`)}
            />
          )
        }
      />

      <ScrollView>
        <View className="px-5 pb-4">
          <Segment
            className="mt-2"
            testID={SEGMENT_TEST_ID}
            options={UNIT_OPTIONS}
            value={screen.unit}
            onChange={screen.chooseUnit}
          />

          <View className="mt-5 flex-row items-center justify-center gap-2 py-2">
            {screen.canGoPrev ? (
              <Button
                variant="ghost"
                size="compact"
                square
                testID={PREV_PERIOD_TEST_ID}
                onPress={screen.goPrev}
              >
                <Icon icon={ChevronLeft} tone="subtle" />
              </Button>
            ) : (
              <ArrowSlot />
            )}

            <Text size="base" weight="medium" numeric>
              {screen.periodLabel}
            </Text>

            {screen.canGoNext ? (
              <Button
                variant="ghost"
                size="compact"
                square
                testID={NEXT_PERIOD_TEST_ID}
                onPress={screen.goNext}
              >
                <Icon icon={ChevronRight} tone="subtle" />
              </Button>
            ) : (
              <ArrowSlot />
            )}
          </View>

          {screen.loading ? (
            <SkeletonLine className="mt-4 h-9 w-2/3" />
          ) : (
            <Text
              size="3xl"
              weight="bold"
              tone="brand"
              numeric
              className="mt-4"
            >
              {screen.amountLabel}
            </Text>
          )}

          <Text size="sm" tone="subtle" className="mt-1">
            {PAYROLL_COPY.estimateNote}
          </Text>

          {screen.loading ? null : (
            <View className="mt-6 gap-2">
              <View className="flex-row items-baseline justify-between">
                <Text size="sm" tone="muted">
                  {PAYROLL_COPY.workLabel}
                </Text>
                <Text size="sm" weight="medium" numeric>
                  {screen.accrual.work}
                </Text>
              </View>

              {screen.accrual.late === null ? null : (
                <View className="flex-row items-baseline justify-between">
                  <Text size="sm" tone="muted">
                    {PAYROLL_COPY.lateLabel}
                  </Text>
                  <Text size="sm" weight="medium" numeric>
                    {screen.accrual.late}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="mt-8">
            {screen.listState === "loading" ? (
              <View className="gap-4">
                {SKELETON_ROWS.map((at) => (
                  <SkeletonLine key={at} className="w-2/3" />
                ))}
              </View>
            ) : screen.listState === "failed" ? (
              <View className="flex-row items-center gap-2">
                <Text size="xs" tone="subtle">
                  {PAYROLL_COPY.readFailed}
                </Text>
                <Button variant="ghost" size="compact" onPress={screen.retry}>
                  {PAYROLL_COPY.retry}
                </Button>
              </View>
            ) : screen.listState === "empty" ? (
              <EmptyState
                scene="no-shifts"
                title={PAYROLL_COPY.emptyTitle}
                description={PAYROLL_COPY.emptyBody}
              />
            ) : screen.listState === "months" ? (
              screen.monthRows.map((row, at) =>
                row.type === "month" ? (
                  <ListRow
                    key={row.month}
                    divider={at > 0}
                    title={row.title}
                    value={row.amountLabel}
                    onPress={() => screen.openMonth(row.month)}
                  />
                ) : (
                  <ListRow
                    key="total"
                    divider={at > 0}
                    title={PAYROLL_COPY.totalTitle}
                    value={row.amountLabel}
                  />
                ),
              )
            ) : (
              screen.historyRows.map((row, at) => (
                <ListRow
                  key={row.date}
                  divider={at > 0}
                  title={row.title}
                  detail={row.subtitle}
                  value={row.amountLabel}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
