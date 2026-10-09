import { SheetLayer } from "@/shared/ui/SheetLayer";
import type { WagesScreenController } from "@/screens/wages/hooks/useWagesScreen";
import { WagesSheetFace } from "@/screens/wages/ui/WagesSheetFace";

export type WagesSheetsProps = {
  screen: WagesScreenController;
};

export function WagesSheets({ screen }: WagesSheetsProps) {
  if (screen.sheet === null) {
    return null;
  }

  return (
    <SheetLayer onDismiss={screen.close}>
      <WagesSheetFace screen={screen} />
    </SheetLayer>
  );
}
