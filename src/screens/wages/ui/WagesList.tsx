import { WageRows } from "@/entities/payroll/ui/WageRows";
import { WageRowsFailed } from "@/entities/payroll/ui/WageRowsFailed";
import { WageRowsLoading } from "@/entities/payroll/ui/WageRowsLoading";
import type { WagesScreenController } from "@/screens/wages/hooks/useWagesScreen";
import { WagesEmpty } from "@/screens/wages/ui/WagesEmpty";
import { WagesLoading } from "@/screens/wages/ui/WagesLoading";

export type WagesListProps = {
  screen: WagesScreenController;
};

export function WagesList({ screen }: WagesListProps) {
  if (screen.listState === "loading") {
    return <WagesLoading />;
  }

  if (screen.listState === "empty") {
    return <WagesEmpty />;
  }

  return (
    <WageRows
      people={screen.people}
      onPressPerson={screen.openPerson}
      pending={<WageRowsLoading />}
      failed={<WageRowsFailed />}
      empty={<WagesEmpty />}
    />
  );
}
