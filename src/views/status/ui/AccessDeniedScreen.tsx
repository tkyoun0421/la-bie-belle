import Link from "next/link";

import { ERROR_CODES } from "@/shared/config/error-codes.config";

export function AccessDeniedScreen({ correlationId }: { correlationId?: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-bold">{ERROR_CODES.COMMON_FORBIDDEN.message}</h1>
      {correlationId ? <p className="text-sm text-text-muted">문의 번호: {correlationId}</p> : null}
      <Link href="/" className="text-sm font-medium text-action underline">
        홈으로 이동
      </Link>
    </main>
  );
}
