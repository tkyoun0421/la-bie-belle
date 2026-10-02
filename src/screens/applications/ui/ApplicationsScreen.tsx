import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { Text } from "@/shared/ui/Text";
import { DeadlineSheet } from "@/features/availabilitySubmit/ui/DeadlineSheet";
import {
  APPLICATIONS_COPY,
  TAB_OPTIONS,
} from "@/screens/applications/consts/applications.const";
import { useApplicationsScreen } from "@/screens/applications/hooks/useApplicationsScreen";

/**
 * 그 달 근무 신청을 두 방향으로 보는 화면이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「근무 신청 모아보기 짜임」이고
 * 완료 조건은 `docs/2-design/spec/schedule-admin.md`의 AC-06이다.
 *
 * **무엇을 그리나가 `listState` 하나에 들어 있다.** 날짜순과 사람순이 로딩·빈 상태와 같은
 * 자리에서 갈려서, 접는 것과 세는 것은 전부 controller 몫이다.
 *
 * **마감일 시트가 여기와 달력 두 자리에서 열린다.** 당길 일이 생기는 문이 둘이라 시트는
 * 슬라이스 밖(`@/features/availabilitySubmit/ui`)에 산다.
 */

/**
 * **같은 표가 저장소 열세 자리에 있다.** 묶음 여럿에 걸려 한 열이 못 접고 AC-13이 받는다.
 */
const SKELETON_ROWS = [0, 1, 2];

export type ApplicationsScreenProps = {
  month?: string;
};

export function ApplicationsScreen({ month }: ApplicationsScreenProps) {
  const router = useRouter();
  const screen = useApplicationsScreen(supabase, month);

  return (
    <Screen>
      <AppBar title={screen.title} onBack={() => router.back()} />

      <ScrollView>
        <View className="gap-3 px-5 pb-8">
          {screen.deadlineLine === null ? null : (
            <View className="flex-row items-center gap-2">
              <Text size="xs" tone="subtle" numeric>
                {screen.deadlineLine}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={screen.openDeadline}
              >
                <Text size="xs" tone="muted">
                  {APPLICATIONS_COPY.changeDeadline}
                </Text>
              </Pressable>
            </View>
          )}

          <Tabs
            items={TAB_OPTIONS}
            value={screen.tab}
            onChange={screen.chooseTab}
          />

          {screen.listState === "loading" ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : screen.listState === "empty" ? (
            <View className="gap-1 py-6">
              <Text size="sm" tone="muted">
                {APPLICATIONS_COPY.empty}
              </Text>
              {screen.emptyDeadlineLine === null ? null : (
                <Text size="sm" tone="muted" numeric>
                  {screen.emptyDeadlineLine}
                </Text>
              )}
            </View>
          ) : screen.listState === "date" ? (
            screen.dateGroups.map((group) => (
              <View key={group.key} className="gap-1">
                <Text size="xs" tone="subtle" numeric>
                  {group.heading}
                </Text>
                <Card className="py-0">
                  {group.names.map((one) => (
                    <ListRow key={one.key} title={one.name} chevron={false} />
                  ))}
                </Card>
              </View>
            ))
          ) : (
            screen.personGroups.map((group) => (
              <View key={group.key} className="gap-1">
                <Card className="py-0">
                  <ListRow
                    title={group.displayName}
                    detail={group.dates}
                    chevron={false}
                  />
                </Card>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {screen.sheet ? (
        <SheetLayer onDismiss={screen.closeDeadline}>
          <DeadlineSheet
            deadline={screen.sheet.deadline}
            today={screen.sheet.today}
            saving={screen.saving}
            failed={screen.failed}
            onClose={screen.closeDeadline}
            onSave={screen.saveDeadline}
          />
        </SheetLayer>
      ) : null}
    </Screen>
  );
}
