"use client";

import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default function Error(_props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen />;
}
