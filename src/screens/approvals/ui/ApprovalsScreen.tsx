import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Screen } from "@/shared/ui/Screen";
import { SkeletonRows } from "@/shared/ui/SkeletonRows";
import { ApprovalsList } from "@/entities/workRequest/ui/ApprovalsList";
import {
  APPROVALS_COPY,
  SKELETON_ROWS,
} from "@/screens/approvals/consts/approvals.const";
import { useApprovalsScreen } from "@/screens/approvals/hooks/useApprovalsScreen";
import { ApprovalsEmpty } from "@/screens/approvals/ui/ApprovalsEmpty";
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
            pending={<SkeletonRows rows={SKELETON_ROWS} frame="card" />}
            empty={<ApprovalsEmpty />}
          />
        </View>
      </ScrollView>

      <ApprovalsSheets screen={screen} />

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
