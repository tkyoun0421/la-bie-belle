import { useEffect } from "react";
import { View } from "react-native";
import { Toast, type ToastKind } from "@/shared/ui/Toast";

/**
 * 방금 한 일이 끝난 것을 알리는 토스트가 서는 자리다. 화면 아래에서 56px이고 좌우 24px을
 * 남긴다(`docs/2-design/design-system/components.md`의 「토스트」) — 표의 첫 줄 값이라
 * 탭 바도 BottomCTA도 없는 화면이 그대로 쓴다. 탭 바가 이 겹 밖에 서는 화면에서도 재는
 * 자리가 탭 바 위라 같은 값이다.
 *
 * 머무는 시간은 문서가 안 정했다. 한 줄을 읽고 남는 길이로 2.4초를 뒀다.
 */

const TOAST_STAY_MS = 2400;

const TOAST_BOTTOM = 56;

export type FloatingToastProps = {
  kind?: ToastKind;
  message: string;
  onDone: () => void;
};

export function FloatingToast({ kind, message, onDone }: FloatingToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, TOAST_STAY_MS);

    return () => clearTimeout(timer);
  }, [message, onDone]);

  return (
    <View
      pointerEvents="none"
      style={{ bottom: TOAST_BOTTOM }}
      className="absolute inset-x-0 px-5"
    >
      <Toast kind={kind}>{message}</Toast>
    </View>
  );
}
