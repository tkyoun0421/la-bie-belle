import type { ReactNode } from "react";
import { Avatar } from "@/shared/ui/Avatar";
import { FragmentView } from "@/shared/ui/FragmentView";
import { ListRow } from "@/shared/ui/ListRow";
import { useWageRows } from "@/entities/payroll/hooks/useWageRows";
import type { WageRowMember } from "@/entities/payroll/model/wageRows.policy";

export type WageRowsProps = {
  people: readonly WageRowMember[];
  onPressPerson: (profileId: string) => void;
  pending?: ReactNode;
  failed?: ReactNode;
  empty?: ReactNode;
};

export function WageRows({
  people,
  onPressPerson,
  pending,
  failed,
  empty,
}: WageRowsProps) {
  const fragment = useWageRows({ people, onPressPerson });

  return (
    <FragmentView
      fragment={fragment}
      pending={pending}
      failed={failed}
      empty={empty}
    >
      {(ready) =>
        ready.rows.map((row, at) => (
          <ListRow
            key={row.profileId}
            title={row.displayName}
            value={row.valueLabel}
            left={<Avatar name={row.displayName} photoUrl={row.photoUrl} />}
            chevron
            divider={at > 0}
            onPress={row.press}
          />
        ))
      }
    </FragmentView>
  );
}
