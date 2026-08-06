import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";

import "@/shared/config/env.server";
import { wantedSans } from "@/shared/config/fonts.config";
import { SnackbarProvider } from "@/shared/ui/snackbar";
import { OfflineBanner } from "@/widgets/offline/ui/OfflineBanner";

export const metadata: Metadata = {
  title: "라비에벨 근무 관리",
  description: "웨딩홀 근무 신청, 배정, 출퇴근과 예상 급여를 한곳에서 관리합니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={wantedSans.variable}>
      <body>
        <OfflineBanner />
        {children}
        <SnackbarProvider />
      </body>
    </html>
  );
}
