import { Pressable, View } from "react-native";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { DAY_SHEET_COPY } from "@/entities/schedule/consts/daySheet.const";
import { DaySheet } from "@/entities/schedule/ui/DaySheet";
import { CancelShiftSheet } from "@/features/workRequest/ui/CancelShiftSheet";
import { RequestSheet } from "@/features/workRequest/ui/RequestSheet";
import type { ScheduleWorkerScreenController } from "@/screens/scheduleWorker/hooks/useScheduleWorkerScreen";

function DaySheetPending() {
  return (
    <View className="gap-3">
      <SkeletonLine className="w-1/3" />
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-2/3" />
    </View>
  );
}

function DaySheetFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text size="sm" tone="subtle">
        {DAY_SHEET_COPY.failed}
      </Text>

      <Pressable onPress={onRetry} hitSlop={8}>
        <Text size="sm" weight="medium">
          {DAY_SHEET_COPY.retry}
        </Text>
      </Pressable>
    </View>
  );
}

export type ScheduleWorkerSheetsProps = {
  screen: ScheduleWorkerScreenController;
};

export function ScheduleWorkerSheets({ screen }: ScheduleWorkerSheetsProps) {
  const sheet = screen.sheet;

  if (sheet === null) {
    return null;
  }

  return (
    <SheetLayer onDismiss={screen.closeSheet}>
      {sheet.kind === "request" ? (
        <RequestSheet
          request={sheet.request}
          onAnswered={screen.closeSheet}
          onSeatTaken={screen.seatTaken}
        />
      ) : null}

      {sheet.kind === "cancel" ? (
        <CancelShiftSheet
          assignmentId={sheet.assignmentId}
          workDate={sheet.workDate}
          position={sheet.position}
          onSent={screen.closeSheet}
        />
      ) : null}

      {sheet.kind === "roster" ? (
        <DaySheet
          workDate={sheet.workDate}
          myProfileId={sheet.myProfileId}
          cancelRequested={sheet.cancelRequested}
          onCancelShift={screen.askCancel}
          onRequestSwap={screen.requestSwap}
          pending={<DaySheetPending />}
          failed={(retry) => <DaySheetFailed onRetry={retry} />}
        />
      ) : null}
    </SheetLayer>
  );
}
