export default function BlockedPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-bg-neutral px-6 pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]">
      <p className="text-sm text-fg-neutral">이 계정은 지금 이용할 수 없어요</p>
    </main>
  );
}
