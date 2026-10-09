import { Redirect } from "expo-router";
import { LOGIN_PATH } from "@/shared/consts/navigation.const";
import { usePendingScreen } from "@/screens/pending/hooks/usePendingScreen";
import { PendingCelebration } from "@/screens/pending/ui/PendingCelebration";
import { PendingForm } from "@/screens/pending/ui/PendingForm";
import { PendingLoading } from "@/screens/pending/ui/PendingLoading";
import { PendingRejected } from "@/screens/pending/ui/PendingRejected";
import { PendingWaiting } from "@/screens/pending/ui/PendingWaiting";

export function PendingScreen() {
  const screen = usePendingScreen();

  if (screen.stage === "signedOut") {
    return <Redirect href={LOGIN_PATH} />;
  }

  if (screen.stage === "loading") {
    return <PendingLoading />;
  }

  if (screen.stage === "celebrating") {
    return <PendingCelebration screen={screen} />;
  }

  if (screen.stage === "waiting") {
    return <PendingWaiting screen={screen} />;
  }

  if (screen.stage === "rejected") {
    return <PendingRejected screen={screen} />;
  }

  return <PendingForm screen={screen} />;
}
