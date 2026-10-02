import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { useMonthAvailabilitiesQuery } from "@/entities/availability/services/useMonthAvailabilitiesQuery";
import { useMonthWindowQuery } from "@/entities/schedule/services/useMonthWindowQuery";
import { useSetApplicationDeadlineMutation } from "@/features/availabilitySubmit/services/useSetApplicationDeadlineMutation";
import { DeadlineSheet } from "@/features/availabilitySubmit/ui/DeadlineSheet";
import {
  applicationsDeadlineLine,
  applicationsEmptyDeadlineLine,
  applicationsTitle,
  groupApplicationsByDate,
  groupApplicationsByPerson,
  spellApplicationDate,
} from "@/screens/applications/utils/applicationsGrouping.utils";

/**
 * 그 달 근무 신청을 두 방향으로 보는 화면이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「근무 신청 모아보기 짜임」이고
 * 완료 조건은 `docs/2-design/spec/schedule-admin.md`의 AC-06이다.
 *
 * **같은 한 질의를 두 번 접는다.** 날짜순은 근무표를 짜는 손을 따라가고 사람순은 「이 사람이
 * 이번 달 며칠을 일할 수 있나」를 본다 — 서버에 두 번 묻지 않는다.
 *
 * **마감일 시트가 여기와 달력 두 자리에서 열린다.** 당길 일이 생기는 문이 둘이라 시트는
 * 슬라이스 밖(`@/features/availabilitySubmit/ui`)에 산다.
 */

const TABS = [
  { value: "date", label: "날짜순" },
  { value: "person", label: "사람순" },
];

const SKELETON_ROWS = [0, 1, 2];

const KST_MONTH = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type ApplicationsScreenProps = {
  month?: string;
};

export function ApplicationsScreen({
  month: monthParam,
}: ApplicationsScreenProps) {
  const router = useRouter();
  const now = new Date().toISOString();
  const today = KST_MONTH.format(new Date(now));

  const [month, setMonth] = useState(monthParam ?? today.slice(0, 7));
  const [tab, setTab] = useState("date");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: schedule } = useMonthWindowQuery(supabase, month);
  const { data: rows, isLoading } = useMonthAvailabilitiesQuery(
    supabase,
    month,
  );

  const {
    mutate: saveDeadline,
    isPending: savingDeadline,
    isSuccess: savedDeadline,
    isError: saveFailed,
    reset: resetSave,
  } = useSetApplicationDeadlineMutation(supabase);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  useEffect(() => {
    if (monthParam !== undefined) {
      setMonth(monthParam);
    }
  }, [monthParam]);

  useEffect(() => {
    if (savedDeadline) {
      setSheetOpen(false);
      resetSave();
    }
  }, [savedDeadline, resetSave]);

  const applications = rows ?? [];
  const deadline = schedule?.applicationDeadline ?? null;

  return (
    <Screen>
      <AppBar title={applicationsTitle(month)} onBack={() => router.back()} />

      <ScrollView>
        <View className="gap-3 px-5 pb-8">
          {deadline === null ? null : (
            <View className="flex-row items-center gap-2">
              <Text size="xs" tone="subtle" numeric>
                {applicationsDeadlineLine({
                  applicationDeadline: deadline,
                  now,
                })}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSheetOpen(true)}
              >
                <Text size="xs" tone="muted">
                  마감일 바꾸기
                </Text>
              </Pressable>
            </View>
          )}

          <Tabs items={TABS} value={tab} onChange={setTab} />

          {isLoading ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : applications.length === 0 ? (
            <View className="gap-1 py-6">
              <Text size="sm" tone="muted">
                아직 들어온 신청이 없어요
              </Text>
              {deadline === null ? null : (
                <Text size="sm" tone="muted" numeric>
                  {applicationsEmptyDeadlineLine(deadline)}
                </Text>
              )}
            </View>
          ) : tab === "date" ? (
            groupApplicationsByDate(applications).map((group) => (
              <View key={group.workDate} className="gap-1">
                <Text size="xs" tone="subtle" numeric>
                  {spellApplicationDate(group.workDate)}
                </Text>
                <Card className="py-0">
                  {group.names.map((name, at) => (
                    <ListRow
                      key={`${group.workDate}-${at}`}
                      title={name}
                      chevron={false}
                    />
                  ))}
                </Card>
              </View>
            ))
          ) : (
            groupApplicationsByPerson(applications).map((group) => (
              <View key={group.profileId} className="gap-1">
                <Card className="py-0">
                  <ListRow
                    title={group.displayName}
                    detail={group.workDates
                      .map((workDate) => spellApplicationDate(workDate))
                      .join(", ")}
                    chevron={false}
                  />
                </Card>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {sheetOpen ? (
        <SheetLayer onDismiss={closeSheet}>
          <DeadlineSheet
            deadline={deadline ?? today}
            today={today}
            saving={savingDeadline}
            failed={saveFailed}
            onClose={closeSheet}
            onSave={(deadlineDate) =>
              saveDeadline({ month, deadline: deadlineDate })
            }
          />
        </SheetLayer>
      ) : null}
    </Screen>
  );
}
