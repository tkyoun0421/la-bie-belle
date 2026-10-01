import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DropTarget, useDragging, useDropState } from "@/shared/ui/DragAndDrop";
import { Text } from "@/shared/ui/Text";

/**
 * 집은 것을 놓아 버리는 영역이다. 화면 아래에 고정으로 서고 집는 동안에만 뜬다.
 *
 * **여기만 critical이다.** 지우는 것 자체는 되돌릴 수 있지만 끌고 있는 동안 「여기 놓으면
 * 없어진다」를 색이 먼저 말해야 잘못 놓는 것을 막는다
 * (`docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「날 상세 색」). 상시로
 * 있는 색이 아니라 끄는 동안만 뜬다.
 */

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
