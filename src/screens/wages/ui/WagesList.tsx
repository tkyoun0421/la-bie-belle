import type { WagesScreenController } from "@/screens/wages/hooks/useWagesScreen";
import { WageRows } from "@/screens/wages/ui/WageRows";
import { WagesEmpty } from "@/screens/wages/ui/WagesEmpty";
import { WagesLoading } from "@/screens/wages/ui/WagesLoading";

export type WagesListProps = {
  screen: WagesScreenController;
};

export function WagesList({ screen }: WagesListProps) {
  if (screen.listState === "loading") {
    return <WagesLoading />;
  }

  if (screen.listState === "empty") {
    return <WagesEmpty />;
  }

  return <WageRows rows={screen.rows} />;
}
