import { redirect } from "next/navigation";

import { listActiveProfilesWithRoles } from "@/entities/identity/api/list-active-profiles-with-roles";
import { requireSuperAdmin } from "@/entities/identity/api/require-super-admin";
import { grantAdmin } from "@/features/role-management/api/grant-admin";
import { revokeAdmin } from "@/features/role-management/api/revoke-admin";
import { ADMIN_PATH } from "@/shared/config/auth-routes.config";
import { AdminRolesView } from "@/views/admin/ui/AdminRolesView";
import { ErrorScreen } from "@/views/status/ui/ErrorScreen";

export default async function AdminRolesPage() {
  const requireResult = await requireSuperAdmin();

  if (!requireResult.ok) {
    redirect(ADMIN_PATH);
  }

  const profilesResult = await listActiveProfilesWithRoles();

  if (!profilesResult.ok) {
    return <ErrorScreen />;
  }

  return (
    <AdminRolesView profiles={profilesResult.data} onGrant={grantAdmin} onRevoke={revokeAdmin} />
  );
}
