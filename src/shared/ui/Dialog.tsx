import type { ReactNode } from "react";
import { Modal, View } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Scrim } from "@/shared/ui/BottomSheet";
import { Button } from "@/shared/ui/Button";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
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
 * **`closeLabel`이 `null`이면 버튼이 하나다.** 동의를 받는 자리가 아니라 못 한다는 것을
 * 말하는 자리에만 준다 — 퇴사를 막는 안내가 그 자리다
 * (`docs/2-design/modules/account/screens/members.md`의 「퇴사 확인 짜임」). 버튼 하나로
 * 동의를 받는 것은 `writing.md`가 막는 다크패턴이라 이 꼴에 확인 동작을 싣지 않는다.
 *
 * 덮개는 투명도가 토큰 안에 들어 있어 따로 얹지 않는다. 시트와 같은 면이라 `BottomSheet`의
 * `Scrim`을 그대로 쓴다.
 *
 * **`notice`는 여기서 보낸 것이 실패했을 때 선다.** 자리는 하단 버튼 위고 Dialog는 안 닫힌다 —
 * 확인을 받으려고 연 자리에서 그 확인이 통신에 실패한 것이라 사람이 다시 누를 자리가 여기여야
 * 한다(`docs/2-design/system/screens/approvals.md`의 「통신에 실패했을 때」). 본문과 달리
 * 알림 블록이라 오류라는 것이 색과 아이콘으로도 읽힌다.
 */

export type DialogProps = {
  visible: boolean;
  title?: string;
  children?: ReactNode;
  notice?: string;
  closeLabel?: string | null;
  onClose: () => void;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
  className?: string;
  testID?: string;
  confirmTestID?: string;
};

export function Dialog({
  visible,
  title,
  children,
  notice,
  closeLabel = "닫기",
  onClose,
  confirmLabel,
  onConfirm,
  destructive = false,
  className,
  testID,
  confirmTestID,
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
          {notice ? (
            <NoticeBlock kind="error" className="mt-4 p-4">
              {notice}
            </NoticeBlock>
          ) : null}
          <View className="mt-5 flex-row gap-3">
            {closeLabel === null ? null : (
              <View className="flex-1">
                <Button variant="secondary" onPress={onClose}>
                  {closeLabel}
                </Button>
              </View>
            )}
            <View className="flex-1">
              <Button
                variant={destructive ? "destructive" : "primary"}
                testID={confirmTestID}
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
