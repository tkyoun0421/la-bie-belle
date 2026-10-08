import { View } from "react-native";
import { Badge } from "@/shared/ui/Badge";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const POSITION_COLUMN_WIDTH = 56;

const STATUS_COLUMN_WIDTH = 92;

export type RosterRowProps = {
  position?: string;
  name?: string;
  training?: boolean;
  mine?: boolean;
  badge?: string;
  status?: string;
  divider?: boolean;
  testID?: string;
};

export function RosterRow({
  position,
  name,
  training = false,
  mine = false,
  badge,
  status,
  divider = false,
  testID,
}: RosterRowProps) {
  return (
    <View
      testID={testID}
      className={cn(
        "flex-row items-center gap-2 px-2 py-2.5",
        mine && "rounded-sm bg-bg-brand-weak",
        divider && "border-t border-stroke-neutral",
      )}
    >
      <View style={{ width: POSITION_COLUMN_WIDTH }}>
        <Text size="xs" tone="subtle">
          {position ?? ""}
        </Text>
      </View>

      <View className="flex-1 flex-row items-center gap-1.5">
        {name === undefined ? (
          <Text size="sm" tone="subtle">
            빈 자리
          </Text>
        ) : (
          <Text size="sm">{name}</Text>
        )}
        {training ? <Badge variant="neutral" label="교육" /> : null}
      </View>

      {mine ? (
        <Text size="sm" tone="brand">
          나
        </Text>
      ) : null}

      {badge === undefined ? null : <Badge variant="neutral" label={badge} />}

      {status === undefined ? null : (
        <View style={{ width: STATUS_COLUMN_WIDTH }}>
          <Text size="xs" tone="muted" numeric className="text-right">
            {status}
          </Text>
        </View>
      )}
    </View>
  );
}
