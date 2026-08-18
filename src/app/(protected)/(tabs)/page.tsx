import { RouteTransition } from "@/shared/ui/route-transition";
import { HomeView } from "@/views/home/ui/HomeView";
import { HOME_BASIC } from "@/views/home/ui/home.mock";

export default function HomePage() {
  return (
    <RouteTransition>
      <HomeView {...HOME_BASIC} />
    </RouteTransition>
  );
}
