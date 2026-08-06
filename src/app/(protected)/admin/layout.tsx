import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { HOME_PATH } from "@/shared/config/auth-routes.config";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const result = await requireAdmin();

  if (!result.ok) {
    redirect(HOME_PATH);
  }

  return <>{children}</>;
}
