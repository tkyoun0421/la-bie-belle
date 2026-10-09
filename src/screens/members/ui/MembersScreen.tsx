import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Input } from "@/shared/ui/Input";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { Text } from "@/shared/ui/Text";
import { MemberSheet } from "@/features/memberAdmin/ui/MemberSheet";
import { MEMBERS_COPY } from "@/screens/members/consts/members.const";
import { useMembersScreen } from "@/screens/members/hooks/useMembersScreen";
import { MemberRows } from "@/screens/members/ui/MemberRows";
import { MembersEmpty } from "@/screens/members/ui/MembersEmpty";
import { MembersLoading } from "@/screens/members/ui/MembersLoading";

export function MembersScreen() {
  const screen = useMembersScreen();

  return (
    <Screen>
      <AppBar title={MEMBERS_COPY.appBarTitle} onBack={screen.goBack} />

      <ScrollView>
        <View className="px-5 pb-5">
          {screen.listState === "loading" ? <MembersLoading /> : null}
          {screen.listState === "empty" ? <MembersEmpty /> : null}

          {screen.listState === "rows" ? (
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
                <MemberRows rows={screen.activeRows} className="mt-4 py-0" />
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
                  <MemberRows rows={screen.leftRows} faded className="py-0">
                    {screen.canExpand ? (
                      <Button variant="ghost" size="sm" onPress={screen.expand}>
                        {MEMBERS_COPY.more}
                      </Button>
                    ) : null}
                  </MemberRows>
                </>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      {screen.sheet === null ? null : (
        <SheetLayer onDismiss={screen.close}>
          <MemberSheet
            member={screen.sheet.member}
            today={screen.today}
            lastAdmin={screen.lastAdmin}
            reachLine={screen.reachLine}
            onDone={screen.finish}
          />
        </SheetLayer>
      )}

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
