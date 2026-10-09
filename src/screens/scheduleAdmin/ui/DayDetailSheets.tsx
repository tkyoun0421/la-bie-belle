import { SheetLayer } from "@/shared/ui/SheetLayer";
import type { DayDetailController } from "@/screens/scheduleAdmin/model/dayDetail.type";
import { DayDetailSheetBody } from "@/screens/scheduleAdmin/ui/DayDetailSheetBody";

export type DayDetailSheetsProps = {
  day: DayDetailController;
};

export function DayDetailSheets({ day }: DayDetailSheetsProps) {
  return (
    <>
      {day.sheets.map((sheet) => (
        <SheetLayer key={sheet.kind} onDismiss={sheet.dismiss}>
          <DayDetailSheetBody day={day} kind={sheet.kind} />
        </SheetLayer>
      ))}
    </>
  );
}
