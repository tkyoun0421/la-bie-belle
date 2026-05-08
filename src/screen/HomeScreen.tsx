import { appInfo } from "@/shared/config/appInfo";

export function HomeScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <section
        className="w-full max-w-3xl rounded-lg border border-stone-200 bg-white p-8 shadow-sm"
        aria-labelledby="page-title"
      >
        <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-emerald-800">
          Development baseline
        </p>
        <h1 id="page-title" className="mb-4 text-4xl font-bold text-slate-950">
          {appInfo.name}
        </h1>
        <p className="text-base leading-7 text-slate-700">{appInfo.description}</p>
      </section>
    </main>
  );
}
