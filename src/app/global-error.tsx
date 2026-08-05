"use client";

import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

import "@/app/globals.css";

export default function GlobalError(_props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <ErrorScreen />
      </body>
    </html>
  );
}
