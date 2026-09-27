import { useEffect } from "react";
import { View } from "react-native";
import { Toast } from "@/shared/ui/Toast";

/**
 * 바뀐 것을 알리는 토스트가 서는 자리다. 탭 바는 이 화면 밖에 서므로 여기서 재는 56px은
 * 탭 바 위에서부터다 — 토스트가 탭 바를 덮지 않는다
 * (`docs/2-design/design-system/components.md`의 「토스트」).
 *
 * 머무는 시간은 문서가 안 정했다. 가입 대기 화면과 같은 2.4초를 뒀다.
 */

const TOAST_STAY_MS = 2400;

const TOAST_BOTTOM = 56;

export type FloatingToastProps = {
  message: string;
  onDone: () => void;
};

export function FloatingToast({ message, onDone }: FloatingToastProps) {
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
      <Toast>{message}</Toast>
    </View>
  );
}
