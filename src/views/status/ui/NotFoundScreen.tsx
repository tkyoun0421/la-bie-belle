import Link from "next/link";

import { ERROR_CODES } from "@/shared/config/error-codes.config";

export function NotFoundScreen({ correlationId }: { correlationId?: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-bold">{ERROR_CODES.COMMON_NOT_FOUND.message}</h1>
      {correlationId ? <p className="text-sm text-gray-500">문의 번호: {correlationId}</p> : null}
      <Link href="/" className="text-sm font-medium text-blue-600 underline">
        홈으로 이동
      </Link>
    </main>
  );
}
