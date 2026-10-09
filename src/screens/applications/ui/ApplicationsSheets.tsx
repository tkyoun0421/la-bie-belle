import { SheetLayer } from "@/shared/ui/SheetLayer";
import { DeadlineSheet } from "@/features/availabilitySubmit/ui/DeadlineSheet";
import type { ApplicationsScreenController } from "@/screens/applications/hooks/useApplicationsScreen";

export type ApplicationsSheetsProps = {
  screen: ApplicationsScreenController;
};

export function ApplicationsSheets({ screen }: ApplicationsSheetsProps) {
  if (screen.sheet === null) {
    return null;
  }

  return (
    <SheetLayer onDismiss={screen.closeDeadline}>
      <DeadlineSheet
        deadline={screen.sheet.deadline}
        today={screen.sheet.today}
        canSave={screen.sheet.canSave}
        saving={screen.saving}
        failed={screen.failed}
        onChange={screen.changeDeadlineDraft}
        onClose={screen.closeDeadline}
        onSave={screen.saveDeadline}
      />
    </SheetLayer>
  );
}
