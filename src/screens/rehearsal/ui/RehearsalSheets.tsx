import { MonthPickerSheet } from "@/shared/ui/MonthPickerSheet";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { RehearsalDaySheet } from "@/entities/rehearsal/ui/RehearsalDaySheet";
import { RehearsalFormSheet } from "@/features/rehearsalEdit/ui/RehearsalFormSheet";
import type { RehearsalScreenController } from "@/screens/rehearsal/hooks/useRehearsalScreen";

export type RehearsalSheetsProps = {
  screen: RehearsalScreenController;
};

export function RehearsalSheets({ screen }: RehearsalSheetsProps) {
  return (
    <>
      {screen.openDate === null ? null : (
        <SheetLayer onDismiss={screen.closeDay}>
          <RehearsalDaySheet
            workDate={screen.openDate}
            month={screen.month}
            isAdmin={screen.isAdmin}
            formKind={screen.openKind}
            onPressRow={screen.openEdit}
            onAdd={screen.openAdd}
          />
        </SheetLayer>
      )}

      {screen.form === null ? null : (
        <SheetLayer onDismiss={screen.closeForm}>
          <RehearsalFormSheet
            target={screen.form}
            dateLabel={screen.openDateLabel}
            onSaved={screen.closeForm}
            onClose={screen.closeForm}
            onRemove={screen.askRemove}
          />
        </SheetLayer>
      )}

      {screen.pickerYear === null ? null : (
        <MonthPickerSheet
          year={screen.pickerYear}
          selectedMonth={screen.month}
          onPick={screen.pickMonth}
          onYearChange={screen.changePickerYear}
          onDismiss={screen.closePicker}
        />
      )}
    </>
  );
}
