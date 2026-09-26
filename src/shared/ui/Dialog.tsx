import type { ReactNode } from "react";
import { Modal, View } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Scrim } from "@/shared/ui/BottomSheet";
import { Button } from "@/shared/ui/Button";
import { Text } from "@/shared/ui/Text";

/**
 * 시트를 쌓지 않고 따로 뜨는 확인이다. 근무 취소 승인과 시급 되돌리기가 여기다 — 시트 위에서
 * 한 번 더 묻는 자리라 시트와 다른 모양이어야 한다.
 *
 * 화면 양옆 32px을 비워 시트보다 좁게 두고 세로로는 화면 한가운데에 선다. 좁은 폭이 「이것은
 * 시트가 아니다」를 모양으로 말한다.
 *
 * **왼쪽 버튼 라벨은 「닫기」다.** 「취소」라고 쓰지 않는 이유는
 * `docs/2-design/design-system/writing.md`에 있다.
 *
 * 버튼은 둘이다. 셋 이상이면 Dialog가 아니라 바텀시트로 간다. 오른쪽은 되돌릴 수 없는
 * 동작일 때만 destructive고 나머지는 primary다.
 *
 * 덮개는 투명도가 토큰 안에 들어 있어 따로 얹지 않는다. 시트와 같은 면이라 `BottomSheet`의
 * `Scrim`을 그대로 쓴다.
 */

export type DialogProps = {
  visible: boolean;
  title?: string;
  children?: ReactNode;
  closeLabel?: string;
  onClose: () => void;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
  className?: string;
  testID?: string;
};

export function Dialog({
  visible,
  title,
  children,
  closeLabel = "닫기",
  onClose,
  confirmLabel,
  onConfirm,
  destructive = false,
  className,
  testID,
}: DialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center px-8">
        <Scrim />
        <View
          testID={testID}
          className={cn(
            "w-full rounded-lg border border-stroke-neutral bg-bg-neutral p-6",
            className,
          )}
        >
          {title ? (
            <Text className="font-semibold text-lg text-fg-neutral">
              {title}
            </Text>
          ) : null}
          {children ? (
            <Text
              className={cn("text-sm text-fg-neutral-muted", title && "mt-2")}
            >
              {children}
            </Text>
          ) : null}
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" onPress={onClose}>
                {closeLabel}
              </Button>
            </View>
            <View className="flex-1">
              <Button
                variant={destructive ? "destructive" : "primary"}
                onPress={onConfirm}
              >
                {confirmLabel}
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
