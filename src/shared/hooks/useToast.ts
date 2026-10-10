import { useCallback, useState } from "react";
import type { ToastKind } from "@/shared/ui/Toast";

export type ToastState = { kind: ToastKind; message: string };

export type ToastController = {
  toast: ToastState | null;
  showToast: (kind: ToastKind, message: string) => void;
  dismissToast: () => void;
};

export function useToast(): ToastController {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((kind: ToastKind, message: string) => {
    setToast({ kind, message });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return { toast, showToast, dismissToast };
}
