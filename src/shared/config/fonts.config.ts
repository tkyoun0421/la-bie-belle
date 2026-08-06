import localFont from "next/font/local";

export const wantedSans = localFont({
  src: "./fonts/WantedSansVariable.woff2",
  variable: "--font-wanted-sans",
  display: "swap",
  fallback: [
    "Wanted Sans",
    "-apple-system",
    "BlinkMacSystemFont",
    "system-ui",
    "Segoe UI",
    "Apple SD Gothic Neo",
    "sans-serif",
  ],
});
