import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function MoreView() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6 pb-24">
      <h1 className="typo-display text-text-strong">전체</h1>
      <ul className="flex flex-col">
        <li>
          <Link
            href="/pay"
            className="flex items-center justify-between border-b border-border py-4 typo-body text-text-strong"
          >
            예상 급여
            <ChevronRight aria-hidden className="size-5 text-text" />
          </Link>
        </li>
      </ul>
    </main>
  );
}
