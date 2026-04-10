import { notFound } from "next/navigation";
import {
  readEventTemplateById,
} from "#/entities/events/repositories/readEventTemplateRepository";
import { countEventTemplateRecords } from "#/entities/events/repositories/writeEventTemplateRepository";
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
  const [template, templatesCount, positions] = await Promise.all([
    readEventTemplateById(templateId, { client }),
    countEventTemplateRecords({ client }),
    readPositions({ client }),
  ]);

  if (!template) {
    notFound();
  }

  return (
    <AdminTemplateEditScreen
      positions={positions}
      template={template}
      templatesCount={templatesCount}
    />
  );
}
