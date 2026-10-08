import { useEffect } from "react";
import { View } from "react-native";
import { Toast, type ToastKind } from "@/shared/ui/Toast";

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
