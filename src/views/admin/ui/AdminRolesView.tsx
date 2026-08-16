import { hasRole } from "@/entities/identity/model/role";
import type { ActiveProfileWithRoles } from "@/entities/identity/types/active-profile";
import type { RoleActionOutcome } from "@/features/role-management/hooks/useRoleActions";
import { RoleActionButtons } from "@/features/role-management/ui/RoleActionButtons";
import { Badge } from "@/shared/ui/badge";
import { roleLabel } from "@/views/admin/model/role-label";

type AdminRolesViewProps = {
  profiles: ActiveProfileWithRoles[];
  onGrant: (targetProfileId: string) => Promise<RoleActionOutcome>;
  onRevoke: (targetProfileId: string) => Promise<RoleActionOutcome>;
};

export function AdminRolesView({ profiles, onGrant, onRevoke }: AdminRolesViewProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6 pb-nav-safe">
      <h1 className="typo-display text-text-strong">역할 관리</h1>
      <ul className="flex flex-col">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            className="flex items-center justify-between gap-3 border-b border-border py-4"
          >
            <div className="flex items-center gap-2">
              <span className="typo-body text-text-strong">{profile.name}</span>
              <Badge tone={hasRole(profile.roles, "admin") ? "action" : "neutral"}>
                {roleLabel(profile.roles)}
              </Badge>
            </div>
            {hasRole(profile.roles, "super_admin") ? null : (
              <RoleActionButtons
                isAdmin={hasRole(profile.roles, "admin")}
                onGrant={onGrant.bind(null, profile.id)}
                onRevoke={onRevoke.bind(null, profile.id)}
              />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
