import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Input } from "@/shared/ui/Input";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { MEMBERS_COPY } from "@/screens/members/consts/members.const";
import { useMembersScreen } from "@/screens/members/hooks/useMembersScreen";
import { MemberDialog } from "@/screens/members/ui/MemberDialog";
import { MemberSheet } from "@/screens/members/ui/MemberSheet";

/**
 * 관리자가 이미 받은 사람들을 다루는 화면이다. 여기서 하는 일이 셋이다 — 이름 고치기,
 * 관리자로 올리고 내리기, 퇴사 처리. 정본은
 * `docs/2-design/modules/account/screens/members.md`고 완료 조건은
 * `docs/2-design/spec/members.md`다.
 *
 * **퇴사한 사람이 같은 화면 아래에 있다.** 별도 화면으로 안 뺀다 — 실수로 퇴사 처리한 것을
 * 되돌리거나 지난 이름을 확인하는 일이 드물지만 있고, 화면을 하나 더 만들 만큼은 아니다.
 * 검색도 두 구획을 같이 거른다.
 *
 * **막는 자리 둘은 서버가 정한다.** 화면이 마지막 관리자의 내리기 버튼을 미리 잠그지만 그것은
 * 목록을 받은 시점의 판정이고, 누르는 시점의 판정은 `last_admin`과
 * `has_future_assignments`로 돌아와 Dialog가 이유를 말한다 — 그 합침은
 * [`useMembersScreen`](../hooks/useMembersScreen.ts)이 한다.
 *
 * **아직 안 그린 둘.** 시급 줄은 시급 표가 서기 전이라 붙일 값이 없고(members.md의 「사람 시트
 * 짜임」), 「근무표로 가기」의 목적지 화면은 아직 없다.
 */

/**
 * 껍데기가 그릴 줄 수다.
 *
 * **같은 값이 저장소 열셋에 쓰는 꼴까지 같다.** 몇 줄인지는 화면이 정하고 `.map`으로 회색
 * 덩이를 그리는 일은 `shared/ui`의 몫이라, 접는 자리가 `consts`가 아닐 수 있다 — AC-13이
 * 받는다.
 */
const SKELETON_ROWS = [0, 1, 2];

export function MembersScreen() {
  const router = useRouter();
  const screen = useMembersScreen(supabase);

  return (
    <Screen>
      <AppBar
        title={MEMBERS_COPY.appBarTitle}
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/admin")
        }
      />

      <ScrollView>
        <View className="px-5 pb-5">
          {screen.listState === "loading" ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : screen.listState === "empty" ? (
            <Card>
              <EmptyState
                scene="no-members"
                title={MEMBERS_COPY.emptyTitle}
                description={MEMBERS_COPY.emptyBody}
              />
            </Card>
          ) : (
            <>
              <Input
                placeholder={MEMBERS_COPY.searchPlaceholder}
                value={screen.query}
                onChangeText={screen.search}
                className="mt-2"
              />

              {screen.searchEmpty ? (
                <Card className="mt-4">
                  <Text size="base" weight="medium" className="text-center">
                    {MEMBERS_COPY.searchEmpty}
                  </Text>
                </Card>
              ) : null}

              {screen.activeRows.length > 0 ? (
                <Card className="mt-4 py-0">
                  {screen.activeRows.map((row, at) => (
                    <ListRow
                      key={row.key}
                      title={row.displayName}
                      detail={row.detail}
                      left={
                        <Avatar
                          name={row.displayName}
                          photoUrl={row.photoUrl}
                        />
                      }
                      right={
                        row.isAdmin ? (
                          <Badge
                            variant="brand"
                            label={MEMBERS_COPY.adminBadge}
                          />
                        ) : undefined
                      }
                      chevron
                      divider={at > 0}
                      onPress={row.press}
                    />
                  ))}
                </Card>
              ) : null}

              {screen.leftRows.length > 0 ? (
                <>
                  <Text
                    size="xs"
                    weight="medium"
                    tone="subtle"
                    className="mt-4 py-2"
                  >
                    {MEMBERS_COPY.leftSection}
                  </Text>
                  <Card className="py-0">
                    {screen.leftRows.map((row, at) => (
                      <ListRow
                        key={row.key}
                        title={row.displayName}
                        value={row.value}
                        left={
                          <Avatar
                            name={row.displayName}
                            photoUrl={row.photoUrl}
                            className="opacity-60"
                          />
                        }
                        chevron
                        divider={at > 0}
                        onPress={row.press}
                      />
                    ))}
                    {screen.canExpand ? (
                      <Button variant="ghost" size="sm" onPress={screen.expand}>
                        {MEMBERS_COPY.more}
                      </Button>
                    ) : null}
                  </Card>
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {screen.sheet === null ? null : (
        <SheetLayer onDismiss={screen.close}>
          <MemberSheet
            member={screen.sheet.member}
            today={screen.today}
            lastAdmin={screen.lastAdmin}
            reachLine={screen.reachLine}
            face={screen.face}
            draft={screen.draft}
            sending={screen.sending}
            failed={screen.failed}
            onFace={screen.showFace}
            onDraft={screen.writeDraft}
            onSaveName={screen.saveName}
            onRole={screen.askRole}
            onMarkLeave={screen.askLeave}
            onUndoLeave={screen.askUndo}
          />
        </SheetLayer>
      )}

      <MemberDialog
        kind={screen.dialog}
        onClose={screen.closeDialog}
        onConfirm={screen.confirm}
      />

      {screen.toast ? (
        <FloatingToast
          kind={screen.toast.kind}
          message={screen.toast.message}
          onDone={screen.dismissToast}
        />
      ) : null}
    </Screen>
  );
}
