import { Avatar } from "@/shared/ui/Avatar";
import { ListRow } from "@/shared/ui/ListRow";
import type { WagesScreenRow } from "@/screens/wages/hooks/useWagesScreen";

export type WageRowsProps = {
  rows: readonly WagesScreenRow[];
};

export function WageRows({ rows }: WageRowsProps) {
  return (
    <>
      {rows.map((row, at) => (
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
