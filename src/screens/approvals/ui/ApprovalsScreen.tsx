import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Screen } from "@/shared/ui/Screen";
import { APPROVALS_COPY } from "@/screens/approvals/consts/approvals.const";
import { useApprovalsScreen } from "@/screens/approvals/hooks/useApprovalsScreen";
import { ApprovalsList } from "@/screens/approvals/ui/ApprovalsList";
import { ApprovalsSheets } from "@/screens/approvals/ui/ApprovalsSheets";

export function ApprovalsScreen() {
  const screen = useApprovalsScreen();

  return (
    <Screen>
      <AppBar title={APPROVALS_COPY.appBarTitle} onBack={screen.goBack} />

      <ScrollView>
        <View className="px-5 pb-5">
          <ApprovalsList screen={screen} />
        </View>
      </ScrollView>

      <ApprovalsSheets screen={screen} />

      {screen.toast ? (
        <FloatingToast
          kind="success"
          message={screen.toast}
          onDone={screen.dismissToast}
        />
      ) : null}
    </Screen>
  );
}
