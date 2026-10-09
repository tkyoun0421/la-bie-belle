import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { PeriodStepper } from "@/shared/ui/PeriodStepper";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { PayrollSummary } from "@/features/payrollCompute/ui/PayrollSummary";
import {
  PAYROLL_COPY,
  SEGMENT_TEST_ID,
  UNIT_OPTIONS,
} from "@/screens/payroll/consts/payroll.const";
import { usePayrollScreen } from "@/screens/payroll/hooks/usePayrollScreen";
import { PayrollList } from "@/screens/payroll/ui/PayrollList";

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

          <PayrollSummary span={screen.span} />

          <View className="mt-8">
            <PayrollList screen={screen} />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
