import { Text } from "@/shared/ui/Text";
import { PENDING_COPY } from "@/screens/membersPending/consts/membersPending.const";

export function PendingEmpty() {
  return (
    <Text size="sm" tone="subtle" className="py-4">
      {PENDING_COPY.empty}
    </Text>
  );
}
