import type { ReactNode } from "react";
import { Modal, View } from "react-native";
import { Scrim } from "@/shared/ui/BottomSheet";
import { Button } from "@/shared/ui/Button";
import { NoticeBlock } from "@/shared/ui/NoticeBlock";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

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
