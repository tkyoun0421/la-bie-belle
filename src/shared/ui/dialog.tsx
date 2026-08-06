"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useRef } from "react";

import { Button } from "@/shared/ui/button";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  tone?: "default" | "destructive";
  children?: ReactNode;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "닫기",
  onConfirm,
  tone = "default",
  children,
}: DialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-text-strong/40" />
        <DialogPrimitive.Content
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-5 shadow-floating"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
        >
          <DialogPrimitive.Title className="typo-title text-text-strong">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 typo-body text-text">
              {description}
            </DialogPrimitive.Description>
          ) : null}
          {children}
          <div className="mt-4 flex justify-end gap-2">
            <DialogPrimitive.Close asChild>
              <Button ref={cancelRef} variant="tertiary">
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
            <Button
              variant={tone === "destructive" ? "destructive" : "secondary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
