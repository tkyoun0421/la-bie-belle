import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Divider } from "@/shared/ui/Divider";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { WAGES_COPY } from "@/screens/wages/consts/wages.const";
import { useWagesScreen } from "@/screens/wages/hooks/useWagesScreen";
import { DefaultWageSheet } from "@/screens/wages/ui/DefaultWageSheet";
import { MemberWageSheet } from "@/screens/wages/ui/MemberWageSheet";
import { ResetWageDialog } from "@/screens/wages/ui/ResetWageDialog";

/**
 * 관리자가 기본 시급과 사람별 시급을 정하는 화면이다. 정본은
 * `docs/2-design/modules/payroll/screens/wages.md`고 완료 조건은
 * `docs/2-design/spec/payroll-wages.md`다.
 *
 * **정해야 할 것이 둘이라 줄도 둘이다.** 기본 시급 줄이 목록에 안 섞이고 맨 위에 따로 선다 —
 * 한 줄이 여러 사람의 값을 한꺼번에 움직이는 자리라 같은 모양으로 늘어놓으면 무게가 안 보인다.
 *
 * **기본을 쓰는 사람을 줄에 표시 안 한다.** 누가 기본을 따라 움직이는지는 맨 위 줄이 수로
 * 말하고, 목록이 답하는 것은 누가 얼마를 받는지다.
 *
 * **질의가 둘이고 시트는 그중에서 갈라 쓴다.** 이름과 사진은 `['members']`가, 시급은
 * `['payroll', 'wages']`가 낸다. 사람 시트의 이력도 목록이 이미 받은 데이터라 시트를 열 때
 * 로딩이 없다.
 *
 * **날짜를 다루는 조각이 하나도 없다.** 적용은 언제나 오늘부터고 미리 넣어두는 길도
 * 소급하는 길도 없다(PAY-008·PAY-009).
 *
 * **`useState`가 하나도 없다.** 금액 칸과 시트 둘과 확인창이 전부 통신에 매여 있어
 * [`useWagesScreen`](../hooks/useWagesScreen.ts)이 든다.
 */

const SKELETON_ROWS = [0, 1, 2];

export function WagesScreen() {
  const router = useRouter();
  const screen = useWagesScreen(supabase);

  return (
    <Screen floor="plain">
      <AppBar
        title={WAGES_COPY.appBarTitle}
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/admin")
        }
      />

      <ScrollView>
        <View className="px-5 pb-5">
          <View>
            <ListRow
              title={WAGES_COPY.baseTitle}
              value={screen.baseValue}
              chevron
              onPress={screen.openBase}
            />
            <Text size="xs" tone="subtle" numeric className="mt-1">
              {screen.baseNote}
            </Text>
          </View>

          <Divider className="my-2" />

          {screen.listState === "loading" ? (
            SKELETON_ROWS.map((at) => (
              <SkeletonLine key={at} className="my-4 w-2/3" />
            ))
          ) : screen.listState === "empty" ? (
            <EmptyState
              scene="no-members"
              title={WAGES_COPY.emptyTitle}
              description={WAGES_COPY.emptyBody}
            />
          ) : (
            screen.rows.map((row, at) => (
              <ListRow
                key={row.profileId}
                title={row.displayName}
                value={row.valueLabel}
                left={<Avatar name={row.displayName} photoUrl={row.photoUrl} />}
                chevron
                divider={at > 0}
                onPress={row.press}
              />
            ))
          )}
        </View>
      </ScrollView>

      {screen.sheet === "default" ? (
        <SheetLayer onDismiss={screen.close}>
          <DefaultWageSheet
            followerLine={screen.followerLine}
            amountText={screen.amountText}
            capHint={screen.capHint}
            canSave={screen.canSave}
            sending={screen.sending}
            failed={screen.failed}
            onDigits={screen.write}
            onClose={screen.close}
            onSave={screen.save}
          />
        </SheetLayer>
      ) : null}

      {screen.member === null ? null : (
        <SheetLayer onDismiss={screen.close}>
          <MemberWageSheet
            name={screen.member.displayName}
            photoUrl={screen.member.photoUrl}
            historyRows={screen.historyRows}
            historyHasMore={screen.historyHasMore}
            amountText={screen.amountText}
            capHint={screen.capHint}
            canSave={screen.canSave}
            canReset={screen.canReset}
            sending={screen.sending}
            failed={screen.failed}
            onDigits={screen.write}
            onExpand={screen.expandHistory}
            onReset={screen.askReset}
            onClose={screen.close}
            onSave={screen.save}
          />
        </SheetLayer>
      )}

      <ResetWageDialog
        visible={screen.asking}
        body={screen.resetBody}
        notice={screen.resetNotice}
        onClose={screen.cancelReset}
        onConfirm={screen.confirmReset}
      />

      {screen.toast ? (
        <FloatingToast message={screen.toast} onDone={screen.dismissToast} />
      ) : null}
    </Screen>
  );
}
