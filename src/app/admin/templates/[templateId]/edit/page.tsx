import { notFound } from "next/navigation";
import { readEventTemplates } from "#/entities/events/repositories/readEventTemplateRepository";
import { readPositions } from "#/entities/positions/repositories/readPositionRepository";
import { AdminTemplateEditScreen } from "#/screens/admin/templates/[templateId]/edit/AdminTemplateEditScreen";
import { requireAdminPageActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type AdminTemplateEditPageProps = {
  params: Promise<{ templateId: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminTemplateEditPage({
  params,
}: AdminTemplateEditPageProps) {
  await requireAdminPageActor();
  const { templateId } = await params;
  const client = createSupabaseAdminClient();
  const [templates, positions] = await Promise.all([
    readEventTemplates({ client }),
    readPositions({ client }),
  ]);
  const template = templates.find((item) => item.id === templateId) ?? null;

  if (!template) {
    notFound();
  }

  return (
    <AdminTemplateEditScreen
      positions={positions}
      template={template}
      templatesCount={templates.length}
    />
  );
}
