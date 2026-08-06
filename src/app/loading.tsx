export default function Loading() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-3 p-6">
      <div className="h-6 w-24 animate-pulse rounded bg-surface-strong" />
      <div className="h-8 w-full animate-pulse rounded bg-surface-strong" />
      <div className="h-24 w-full animate-pulse rounded bg-surface-strong" />
    </main>
  );
}
