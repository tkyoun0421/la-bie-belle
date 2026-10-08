import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDragging, useDropState } from "@/shared/stores/drag.context";
import { DropTarget } from "@/shared/ui/DropTarget";
import { Text } from "@/shared/ui/Text";

export type DropZoneProps = {
  id: string;
  label: string;
  activeLabel: string;
};

export function DropZone({ id, label, activeLabel }: DropZoneProps) {
  const insets = useSafeAreaInsets();
  const dragging = useDragging();
  const state = useDropState(id);

  if (!dragging) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{ paddingBottom: insets.bottom }}
      className="absolute inset-x-0 bottom-0"
    >
      <DropTarget
        id={id}
        className="mx-6 mb-4 h-14 items-center justify-center rounded-lg bg-bg-critical-weak"
      >
        <Text size="sm" weight="medium" tone="critical">
          {state === "over" ? activeLabel : label}
        </Text>
      </DropTarget>
    </View>
  );
}
