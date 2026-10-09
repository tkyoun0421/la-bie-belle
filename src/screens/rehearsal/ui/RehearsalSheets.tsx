import { MonthPickerSheet } from "@/shared/ui/MonthPickerSheet";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { RehearsalFormSheet } from "@/features/rehearsalEdit/ui/RehearsalFormSheet";
import type { RehearsalScreenController } from "@/screens/rehearsal/hooks/useRehearsalScreen";
import { RehearsalDaySheet } from "@/screens/rehearsal/ui/RehearsalDaySheet";

export type RehearsalSheetsProps = {
  screen: RehearsalScreenController;
};

export function RehearsalSheets({ screen }: RehearsalSheetsProps) {
  return (
    <>
      {screen.openDate === null ? null : (
        <SheetLayer onDismiss={screen.closeDay}>
          <RehearsalDaySheet
            title={screen.openDateLabel}
            content={screen.dayContent}
            canAdd={screen.canAdd}
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
