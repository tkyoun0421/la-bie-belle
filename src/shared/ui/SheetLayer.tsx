import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, Scrim } from "@/shared/ui/BottomSheet";

/**
 * 화면 위에 덮개와 시트를 한 겹 얹는다. 시트 위에 시트를 쌓지 않는 화면들이 이 겹 하나를
 * 돌려 쓴다 — 「나」의 시트 셋, 가입 대기의 상세와 확인, 직원 관리의 사람 시트가 그 자리다.
 * 한 번에 하나만 서므로 이 겹도 늘 하나다.
 *
 * 덮개를 누르면 닫힌다. 안쪽 여백은 화면 좌우 여백과 같고 아래는 기기의 안전 영역만큼 더
 * 내려간다.
 */

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
