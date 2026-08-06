import { signOut } from "@/features/auth/api/sign-out";
import { MoreView } from "@/views/more/ui/MoreView";

export default function MorePage() {
  return <MoreView onSignOut={signOut} />;
}
