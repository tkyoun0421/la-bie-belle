import { enterRoute } from "@/app/auth-gate";

export default async function Home() {
  await enterRoute("/");

  return (
    <main className="flex flex-1 flex-col bg-bg-neutral px-6 pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]" />
  );
}
