"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { resolveScreenTitle } from "@/widgets/app-shell/model/screen-title";

type AppHeaderProps = {
  bellSlot: ReactNode;
  bannerSlot?: ReactNode;
};

type HeaderRowProps = {
  title: string;
  bellSlot: ReactNode;
};

function HeaderRow({ title, bellSlot }: HeaderRowProps) {
  return (
    <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-between px-4">
      <h1 className="typo-headline-md text-text-strong">{title}</h1>
      {bellSlot}
    </div>
  );
}

export function AppHeader({ bellSlot, bannerSlot }: AppHeaderProps) {
  const pathname = usePathname();
  const title = resolveScreenTitle(pathname);

  return (
    <>
      <div
        aria-hidden
        data-testid="app-header-spacer"
        className="invisible flex flex-col pt-[env(safe-area-inset-top)]"
      >
        <HeaderRow title={title} bellSlot={bellSlot} />
        {bannerSlot}
      </div>
      <div
        data-app-shell
        data-testid="app-header-shell"
        className="fixed inset-x-0 top-0 z-40 flex flex-col bg-canvas/50 pt-[env(safe-area-inset-top)] backdrop-blur-[9px]"
      >
        <HeaderRow title={title} bellSlot={bellSlot} />
        {bannerSlot}
      </div>
    </>
  );
}
