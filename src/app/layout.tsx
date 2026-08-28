import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

const WANTED_SANS_CDN = "https://cdn.jsdelivr.net";

const WANTED_SANS_STYLESHEET = `${WANTED_SANS_CDN}/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.css`;

export const metadata: Metadata = {
  title: "La Bie Belle",
  description: "La Bie Belle",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link rel="preconnect" href={WANTED_SANS_CDN} crossOrigin="anonymous" />
        <link rel="stylesheet" href={WANTED_SANS_STYLESHEET} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
