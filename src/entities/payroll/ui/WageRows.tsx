import { Avatar } from "@/shared/ui/Avatar";
import { ListRow } from "@/shared/ui/ListRow";
import { useWageRows } from "@/entities/payroll/hooks/useWageRows";
import type { WageRowMember } from "@/entities/payroll/model/wageRows.policy";
import { WageRowsFailed } from "@/entities/payroll/ui/WageRowsFailed";
import { WageRowsLoading } from "@/entities/payroll/ui/WageRowsLoading";

export type WageRowsProps = {
  people: readonly WageRowMember[];
  onPressPerson: (profileId: string) => void;
};

export function WageRows({ people, onPressPerson }: WageRowsProps) {
  const fragment = useWageRows({ people, onPressPerson });

  if (fragment.state === "pending") {
    return <WageRowsLoading />;
  }

  if (fragment.state === "failed") {
    return <WageRowsFailed />;
  }

  return (
    <>
      {fragment.rows.map((row, at) => (
        <ListRow
          key={row.profileId}
          title={row.displayName}
          value={row.valueLabel}
          left={<Avatar name={row.displayName} photoUrl={row.photoUrl} />}
          chevron
          divider={at > 0}
          onPress={row.press}
        />
      ))}
    </>
  );
}
