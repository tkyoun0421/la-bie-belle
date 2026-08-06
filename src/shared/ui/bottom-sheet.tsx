"use client";

import type { ReactNode } from "react";
import { Drawer } from "vaul";

import { cn } from "@/shared/lib/cn";

type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
};

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dismissible = true,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-text-strong/40" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-xl bg-surface",
          )}
        >
          <div className="shrink-0 px-4 pt-4 pb-2">
            <Drawer.Title className="typo-title text-text-strong">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="typo-caption text-text-muted">
                {description}
              </Drawer.Description>
            ) : null}
          </div>
          <div className="flex-1 overflow-y-auto px-4">{children}</div>
          {footer ? <div className="shrink-0 border-t border-border p-4">{footer}</div> : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
