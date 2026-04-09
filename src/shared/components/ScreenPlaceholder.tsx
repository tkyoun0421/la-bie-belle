type ScreenPlaceholderProps = {
  description: string;
  eyebrow: string;
  title: string;
};

export function ScreenPlaceholder({
  description,
  eyebrow,
  title
}: ScreenPlaceholderProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col gap-6 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_70%,#2563eb_100%)] px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
          {description}
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface)] p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Phase 0 bootstrap
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-subtle)]">
            Route, flow, shared, query, mutation, test, and Supabase directories
            are now ready to fill.
          </p>
        </article>
        <article className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface)] p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Absolute imports
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-subtle)]">
            Internal source files are expected to use the <code>#/*</code> alias
            instead of relative paths.
          </p>
        </article>
        <article className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface)] p-5 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Next slice
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-subtle)]">
            Wire real domain queries and mutations into these placeholder routes
            as each vertical slice is implemented.
          </p>
        </article>
      </section>
    </main>
  );
}
