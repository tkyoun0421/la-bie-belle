"use client";

import { Toaster, toast } from "sonner";

export function SnackbarProvider() {
  return (
    <Toaster
      position="bottom-center"
      offset={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 64px)" }}
      toastOptions={{
        classNames: {
          toast: "typo-body rounded-lg bg-text-strong text-surface",
          actionButton: "typo-label text-action-surface",
        },
      }}
    />
  );
}

type SnackbarAction = {
  label: string;
  onClick: () => void;
};

type ShowSnackbarOptions = {
  action?: SnackbarAction;
  duration?: number;
};

export function showSnackbar(message: string, options?: ShowSnackbarOptions) {
  toast(message, {
    action: options?.action,
    duration: options?.duration,
  });
}
