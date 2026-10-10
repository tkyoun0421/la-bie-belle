import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Screen } from "@/shared/ui/Screen";
import { ApprovalsList } from "@/entities/workRequest/ui/ApprovalsList";
import { APPROVALS_COPY } from "@/screens/approvals/consts/approvals.const";
import { useApprovalsScreen } from "@/screens/approvals/hooks/useApprovalsScreen";
import { ApprovalsEmpty } from "@/screens/approvals/ui/ApprovalsEmpty";
import { ApprovalsLoading } from "@/screens/approvals/ui/ApprovalsLoading";
import { ApprovalsSheets } from "@/screens/approvals/ui/ApprovalsSheets";

export function ApprovalsScreen() {
  const screen = useApprovalsScreen();

  return (
    <Screen>
      <AppBar title={APPROVALS_COPY.appBarTitle} onBack={screen.goBack} />

      <ScrollView>
        <View className="px-5 pb-5">
          <ApprovalsList
            answered={screen.answered}
            onPress={screen.openApproval}
            pending={<ApprovalsLoading />}
            empty={<ApprovalsEmpty />}
          />
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
