import { View } from "react-native";
import { Button } from "@/shared/ui/Button";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { Text } from "@/shared/ui/Text";
import {
  BLOCKED_COPY,
  UNBLOCK_CONFIRM_TEST_ID,
} from "@/screens/membersPending/consts/membersPending.const";
import type { MembersBlockedController } from "@/screens/membersPending/hooks/useMembersBlockedScreen";

export type MembersBlockedSheetsProps = {
  screen: MembersBlockedController;
};

export function MembersBlockedSheets({ screen }: MembersBlockedSheetsProps) {
  if (screen.confirming === null) {
    return null;
  }

  return (
    <SheetLayer onDismiss={screen.close}>
      <Text size="base" weight="medium">
        {screen.confirming.question}
      </Text>
      <Text size="sm" tone="muted" className="mt-1">
        {BLOCKED_COPY.confirmNote}
      </Text>

      {screen.failedLine === null ? null : (
        <Text size="xs" tone="critical" className="mt-3">
          {screen.failedLine}
        </Text>
      )}

      <View className="mt-6 flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={screen.close}>
          {BLOCKED_COPY.close}
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          testID={UNBLOCK_CONFIRM_TEST_ID}
          loading={screen.sending}
          onPress={screen.unblock}
        >
          {BLOCKED_COPY.unblock}
        </Button>
      </View>
    </SheetLayer>
  );
}
