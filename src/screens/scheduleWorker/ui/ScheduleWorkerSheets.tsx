import { SheetLayer } from "@/shared/ui/SheetLayer";
import { CancelShiftSheet } from "@/features/workRequest/ui/CancelShiftSheet";
import { RequestSheet } from "@/features/workRequest/ui/RequestSheet";
import type { ScheduleWorkerScreenController } from "@/screens/scheduleWorker/hooks/useScheduleWorkerScreen";
import { DaySheet } from "@/screens/scheduleWorker/ui/DaySheet";

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
          title={sheet.title}
          subtitle={sheet.subtitle}
          rows={sheet.rows}
          myProfileId={sheet.myProfileId}
          myBadge={sheet.myBadge}
          showActions={sheet.showActions}
          actionsEnabled={sheet.actionsEnabled}
          onCancelShift={screen.askCancel}
          onRequestSwap={screen.requestSwap}
        />
      ) : null}
    </SheetLayer>
  );
}
