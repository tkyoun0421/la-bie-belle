import { Text } from "@/shared/ui/Text";
import { BLOCKED_COPY } from "@/screens/membersPending/consts/membersPending.const";

export function BlockedEmpty() {
  return (
    <Text size="sm" tone="subtle" className="py-4">
      {BLOCKED_COPY.empty}
    </Text>
  );
}
