import { useConfirmSheet } from "@/screens/scheduleAdmin/hooks/useConfirmSheet";
import type { ConfirmSheetInput } from "@/screens/scheduleAdmin/model/confirmSheet.type";
import { ConfirmSheetAsk } from "@/screens/scheduleAdmin/ui/ConfirmSheetAsk";
import { ConfirmSheetDone } from "@/screens/scheduleAdmin/ui/ConfirmSheetDone";
import { ConfirmSheetFailed } from "@/screens/scheduleAdmin/ui/ConfirmSheetFailed";

export type ConfirmSheetProps = ConfirmSheetInput & {
  confirming: boolean;
  onConfirm: () => void;
};

export function ConfirmSheet({
  confirming,
  onConfirm,
  ...input
}: ConfirmSheetProps) {
  const sheet = useConfirmSheet(input);

  if (sheet.face === "done") {
    return <ConfirmSheetDone title={sheet.doneTitle} note={sheet.doneNote} />;
  }

  if (sheet.face === "failed") {
    return <ConfirmSheetFailed confirming={confirming} onConfirm={onConfirm} />;
  }

  return (
    <ConfirmSheetAsk
      title={sheet.askTitle}
      buttonLabel={sheet.askButtonLabel}
      vacancy={sheet.vacancy}
      confirming={confirming}
      onClose={input.onClose}
      onConfirm={onConfirm}
    />
  );
}
