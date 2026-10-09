import type { OpenSlot } from "@/entities/schedule/model/schedule.type";
import { useConfirmSheet } from "@/features/scheduleConfirm/hooks/useConfirmSheet";
import { ConfirmSheetAsk } from "@/features/scheduleConfirm/ui/ConfirmSheetAsk";
import { ConfirmSheetDone } from "@/features/scheduleConfirm/ui/ConfirmSheetDone";
import { ConfirmSheetFailed } from "@/features/scheduleConfirm/ui/ConfirmSheetFailed";

export type ConfirmSheetProps = {
  month: string;
  openSlots: readonly OpenSlot[];
  notifiedCount: number;
  onClose: () => void;
};

export function ConfirmSheet({
  month,
  openSlots,
  notifiedCount,
  onClose,
}: ConfirmSheetProps) {
  const sheet = useConfirmSheet({
    month,
    openSlots,
    notifiedCount,
    onClose,
  });

  if (sheet.face === "done") {
    return <ConfirmSheetDone title={sheet.doneTitle} note={sheet.doneNote} />;
  }

  if (sheet.face === "failed") {
    return (
      <ConfirmSheetFailed
        confirming={sheet.confirming}
        onConfirm={sheet.confirm}
      />
    );
  }

  return (
    <ConfirmSheetAsk
      title={sheet.askTitle}
      buttonLabel={sheet.askButtonLabel}
      vacancy={sheet.vacancy}
      confirming={sheet.confirming}
      onClose={onClose}
      onConfirm={sheet.confirm}
    />
  );
}
