import { FragmentView } from "@/shared/ui/FragmentView";
import { SkeletonRows } from "@/shared/ui/SkeletonRows";
import { WageRows } from "@/entities/payroll/ui/WageRows";
import { WageRowsFailed } from "@/entities/payroll/ui/WageRowsFailed";
import { WageRowsLoading } from "@/entities/payroll/ui/WageRowsLoading";
import { SKELETON_ROWS } from "@/screens/wages/consts/wages.const";
import type { WagesScreenController } from "@/screens/wages/hooks/useWagesScreen";
import { WagesEmpty } from "@/screens/wages/ui/WagesEmpty";

export type WagesListProps = {
  screen: WagesScreenController;
};

export function WagesList({ screen }: WagesListProps) {
  return (
    <FragmentView
      fragment={screen.listState}
      pending={<SkeletonRows rows={SKELETON_ROWS} frame="bare" />}
      empty={<WagesEmpty />}
    >
      {() => (
        <WageRows
          people={screen.people}
          onPressPerson={screen.openPerson}
          pending={<WageRowsLoading />}
          failed={<WageRowsFailed />}
          empty={<WagesEmpty />}
        />
      )}
    </FragmentView>
  );
}
