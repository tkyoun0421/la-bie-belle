import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { appInfo } from "@/shared/config/appInfo";

export const metadata: Metadata = {
  title: appInfo.name,
  description: appInfo.description
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
