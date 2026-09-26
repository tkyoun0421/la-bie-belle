import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, Scrim } from "@/shared/ui/BottomSheet";

/**
 * 화면 위에 덮개와 시트를 한 겹 얹는다. 가입 대기의 상세 시트와 차단한 사람의 확인 시트가
 * 같은 자리를 쓴다 — 시트 위에 시트를 쌓지 않는다는 결정이라
 * (`docs/2-design/modules/account/screens/members-pending.md`) 이 겹은 늘 하나다.
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
        className="px-6 pt-6"
      >
        {children}
      </BottomSheet>
    </View>
  );
}
