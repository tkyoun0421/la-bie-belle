import { requireAdminPageActor } from "#/shared/lib/auth/adminActor";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminPageActor();

  return children;
}
