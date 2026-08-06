import { findOwnRoles } from "@/entities/identity/api/find-own-roles";
import { signOut } from "@/features/auth/api/sign-out";
import { MoreView } from "@/views/more/ui/MoreView";

export default async function MorePage() {
  const rolesResult = await findOwnRoles();
  const roles = rolesResult.ok ? rolesResult.data : [];

  return <MoreView onSignOut={signOut} roles={roles} />;
}
