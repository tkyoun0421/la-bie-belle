import type { Metadata } from "next";
import "#/app/globals.css";
import { AppProviders } from "#/app/_providers/AppProviders";

export const metadata: Metadata = {
  title: "la-bie-belle",
  description: "Wedding hall operations PWA bootstrap"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
