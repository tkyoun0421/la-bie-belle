import { useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { useHardwareBack } from "@/shared/hooks/useHardwareBack";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Dialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { MonthCalendar } from "@/shared/ui/MonthCalendar";
import { MonthPickerSheet } from "@/shared/ui/MonthPickerSheet";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { Text } from "@/shared/ui/Text";
import {
  MONTH_CHEVRON_SIZE,
  MONTH_TEST_ID,
  REHEARSAL_COPY,
  REMOVE_CONFIRM_TEST_ID,
} from "@/screens/rehearsal/consts/rehearsal.const";
import { useRehearsalScreen } from "@/screens/rehearsal/hooks/useRehearsalScreen";
import { RehearsalDaySheet } from "@/screens/rehearsal/ui/RehearsalDaySheet";
import { RehearsalFormSheet } from "@/screens/rehearsal/ui/RehearsalFormSheet";

/**
 * 자격이 있는 사람이 자기 리허설을 넣고 고치고 지우는 화면이다. 정본은
 * `docs/2-design/modules/schedule/screens/rehearsal.md`고 완료 조건은
 * `docs/2-design/spec/rehearsal.md`다.
 *
 * **근무표와 떨어져 있다.** 리허설은 날이 열렸는지 근무표가 확정됐는지를 안 보고 아무
 * 날짜에나 서기 때문에(`docs/2-design/modules/schedule/README.md`의 SCH-022) `/schedule`의
 * 날 시트를 문으로 쓸 수 없다 — 확정 전 달에서는 그 시트가 제출 모드라 열리지 않는다. 같은
 * 손짓을 쓰되 달력을 따로 세운다.
 *
 * **모든 날이 눌린다.** 근무표 달력과 가장 다른 자리다. 지난 달도 내년도 같고 흐려지는 칸이
 * 없다.
 *
 * **바닥에 고정 버튼이 없다.** 넣는 문이 날마다 있어서다 — 화면 아래에 「리허설 넣기」를
 * 세우면 어느 날에 넣을지를 다시 물어야 하고, 그것이 달력을 세운 이유를 지운다.
 *
 * **관리자는 같은 화면을 읽기만 한다.** 칸의 수가 전원 것이고 줄에 이름이 붙으며 넣는 길이
 * 없다(SCH-020).
 *
 * **읽는 중에는 바닥 단과 합계만 빈다.** 스켈레톤을 안 깐다 — 달력 뼈대는 날짜만으로 이미
 * 서 있고 넣는 일은 읽기가 끝나기를 안 기다린다.
 *
 * **남은 `useState`는 달 고르기 하나다.** 사람이 열고 사람이 닫고 서버가 모르는 값이라
 * 화면 것이다 — 업무 상태와 통신은
 * [`useRehearsalScreen`](../hooks/useRehearsalScreen.ts)이 든다.
 *
 * 문을 지키는 것은 이 화면이 아니라 라우트다(`src/app/me/rehearsals.tsx`) — 자격 판정에
 * 「나」 슬라이스의 손이 필요해 조립이 위 층에서 일어난다.
 */

export type RehearsalScreenProps = {
  month?: string;
};

export function RehearsalScreen({ month: monthParam }: RehearsalScreenProps) {
  const router = useRouter();
  const screen = useRehearsalScreen(supabase, monthParam);

  const [pickerYear, setPickerYear] = useState<number | null>(null);

  useHardwareBack(screen.closeTop);

  return (
    <Screen>
      <AppBar
        title={REHEARSAL_COPY.appBarTitle}
        onBack={() => router.replace("/me")}
      />

      <ScrollView>
        <View className="gap-3 px-5 pb-5">
          <View className="h-12 flex-row items-center justify-between gap-3">
            <Pressable
              accessibilityRole="button"
              testID={MONTH_TEST_ID}
              onPress={() => setPickerYear(screen.monthYear)}
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
              canPress={() => true}
              onPressDay={screen.openDay}
              noteOf={screen.noteOf}
            />
          </Card>

          <Text size="xs" tone="subtle">
            {REHEARSAL_COPY.legend}
          </Text>

          {screen.failed ? (
            <View className="flex-row items-center gap-2">
              <Text size="xs" tone="subtle">
                {REHEARSAL_COPY.readFailed}
              </Text>
              <Button variant="ghost" size="compact" onPress={screen.retry}>
                {REHEARSAL_COPY.retry}
              </Button>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {screen.openDate === null ? null : (
        <SheetLayer onDismiss={screen.closeDay}>
          <RehearsalDaySheet
            title={screen.openDateLabel}
            content={screen.dayContent}
            canAdd={screen.canAdd}
            onPressRow={screen.openEdit}
            onAdd={screen.openAdd}
          />
        </SheetLayer>
      )}

      {screen.form === null ? null : (
        <SheetLayer onDismiss={screen.closeForm}>
          <RehearsalFormSheet
            mode={screen.form.mode}
            dateLabel={screen.openDateLabel}
            state={screen.sheet}
            saving={screen.saving}
            onChange={screen.change}
            onSubmit={screen.submit}
            onClose={screen.closeForm}
            onRemove={screen.askRemove}
          />
        </SheetLayer>
      )}

      {pickerYear === null ? null : (
        <MonthPickerSheet
          year={pickerYear}
          selectedMonth={screen.month}
          onPick={(picked) => {
            screen.pickMonth(picked);
            setPickerYear(null);
          }}
          onYearChange={setPickerYear}
          onDismiss={() => setPickerYear(null)}
        />
      )}

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
