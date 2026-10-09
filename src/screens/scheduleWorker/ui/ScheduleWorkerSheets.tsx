import { SheetLayer } from "@/shared/ui/SheetLayer";
import type { ScheduleWorkerScreenController } from "@/screens/scheduleWorker/hooks/useScheduleWorkerScreen";
import { CancelShiftSheet } from "@/screens/scheduleWorker/ui/CancelShiftSheet";
import { DaySheet } from "@/screens/scheduleWorker/ui/DaySheet";
import { RequestSheet } from "@/screens/scheduleWorker/ui/RequestSheet";

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
          subtitle={sheet.subtitle}
          state={sheet.state}
          sending={sheet.sending}
          failed={sheet.failed}
          onDecline={screen.decline}
          onAccept={screen.accept}
        />
      ) : null}

      {sheet.kind === "cancel" ? (
        <CancelShiftSheet
          title={sheet.title}
          reason={sheet.reason}
          canSend={sheet.canSend}
          sending={sheet.sending}
          failed={sheet.failed}
          onChangeReason={screen.writeReason}
          onSend={screen.sendCancel}
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
