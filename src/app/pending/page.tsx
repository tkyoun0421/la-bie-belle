import { PendingScreen } from "@/screens/pending/ui/pending-screen";
import { enterPendingRoute } from "@/app/auth-gate";

export default async function PendingPage() {
  const { email, avatarUrl } = await enterPendingRoute();

  return <PendingScreen email={email} avatarUrl={avatarUrl} />;
}
