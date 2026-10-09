import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import {
  PAYROLL_COPY,
  SEGMENT_TEST_ID,
  UNIT_OPTIONS,
} from "@/screens/payroll/consts/payroll.const";
import { usePayrollScreen } from "@/screens/payroll/hooks/usePayrollScreen";
import { PayrollList } from "@/screens/payroll/ui/PayrollList";
import { PayrollSummary } from "@/screens/payroll/ui/PayrollSummary";
import { PeriodStepper } from "@/screens/payroll/ui/PeriodStepper";

export function PayrollScreen() {
  const screen = usePayrollScreen();

  return (
    <Screen floor="plain">
      <AppBar
        title={PAYROLL_COPY.appBarTitle}
        onBack={screen.goBack}
        right={
          screen.showBell ? (
            <BellIcon
              testID="bell-icon"
              unread={screen.unread}
              onPress={screen.openNotifications}
            />
          ) : undefined
        }
      />

      <ScrollView>
        <View className="px-5 pb-4">
          <Segment
            className="mt-2"
            testID={SEGMENT_TEST_ID}
            options={UNIT_OPTIONS}
            value={screen.unit}
            onChange={screen.chooseUnit}
          />

          <PeriodStepper
            label={screen.periodLabel}
            canGoPrev={screen.canGoPrev}
            canGoNext={screen.canGoNext}
            onPrev={screen.goPrev}
            onNext={screen.goNext}
          />

          <PayrollSummary screen={screen} />

          <View className="mt-8">
            <PayrollList screen={screen} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
