import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { type ReactNode, useCallback } from "react";
import { BottomSheet } from "@/shared/ui/BottomSheet";

const TRANSPARENT = { backgroundColor: "transparent" } as const;

export type DraggableSheetProps = {
  snapPoints: (string | number)[];
  index?: number;
  onClose?: () => void;
  children: ReactNode;
};

export function DraggableSheet({
  snapPoints,
  index = 0,
  onClose,
  children,
}: DraggableSheetProps) {
  const backdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  );

  return (
    <GorhomBottomSheet
      index={index}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backdropComponent={backdrop}
      backgroundStyle={TRANSPARENT}
      handleComponent={null}
      style={TRANSPARENT}
    >
      <BottomSheetView>
        <BottomSheet>{children}</BottomSheet>
      </BottomSheetView>
    </GorhomBottomSheet>
  );
}
