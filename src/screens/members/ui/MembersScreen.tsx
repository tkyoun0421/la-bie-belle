import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
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

const SKELETON_ROWS = [0, 1, 2];

export function MembersScreen() {
  const router = useRouter();
  const screen = useMembersScreen();

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
