import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Screen } from "@/shared/ui/Screen";
import { BLOCKED_COPY } from "@/screens/membersPending/consts/membersPending.const";
import { useMembersBlockedScreen } from "@/screens/membersPending/hooks/useMembersBlockedScreen";
import { BlockedEmpty } from "@/screens/membersPending/ui/BlockedEmpty";
import { BlockedLoading } from "@/screens/membersPending/ui/BlockedLoading";
import { BlockedRows } from "@/screens/membersPending/ui/BlockedRows";
import { MembersBlockedSheets } from "@/screens/membersPending/ui/MembersBlockedSheets";

export function MembersBlockedScreen() {
  const screen = useMembersBlockedScreen();

  return (
    <Screen>
      <AppBar title={BLOCKED_COPY.appBarTitle} onBack={screen.goBack} />

      <ScrollView>
        <View className="px-5 pb-5">
          {screen.listState === "loading" ? <BlockedLoading /> : null}
          {screen.listState === "empty" ? <BlockedEmpty /> : null}
          {screen.listState === "rows" ? (
            <BlockedRows rows={screen.rows} />
          ) : null}
        </View>
      </ScrollView>

      <MembersBlockedSheets screen={screen} />

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
