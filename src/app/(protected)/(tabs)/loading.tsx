import { RouteTransition } from "@/shared/ui/route-transition";

export default function TabsLoading() {
  return (
    <RouteTransition>
      <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-3 p-6 pb-nav-safe">
        <div className="h-6 w-24 rounded-xs bg-border" />
        <div className="h-8 w-full rounded-xs bg-border" />
        <div className="h-24 w-full rounded-xs bg-border" />
      </main>
    </RouteTransition>
  );
}
