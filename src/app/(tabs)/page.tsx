import { HomeView } from "@/views/home/ui/HomeView";
import { HOME_NEXT_SHIFT } from "@/views/home/ui/home.mock";

export default function HomePage() {
  return <HomeView model={HOME_NEXT_SHIFT} />;
}
