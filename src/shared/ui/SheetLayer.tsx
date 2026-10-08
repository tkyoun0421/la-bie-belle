import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, Scrim } from "@/shared/ui/BottomSheet";

const SHEET_BOTTOM_PADDING = 24;

export type SheetLayerProps = {
  onDismiss: () => void;
  children: ReactNode;
};

export function SheetLayer({ onDismiss, children }: SheetLayerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="absolute inset-0 justify-end">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        onPress={onDismiss}
        className="flex-1"
      >
        <Scrim />
      </Pressable>
      <BottomSheet
        style={{ paddingBottom: SHEET_BOTTOM_PADDING + insets.bottom }}
        className="px-5 pt-5"
      >
        {children}
      </BottomSheet>
    </View>
  );
}
