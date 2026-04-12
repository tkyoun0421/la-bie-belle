import { notFound } from "next/navigation";
import {
  readEventTemplateById,
} from "#/entities/events/repositories/readEventTemplateRepository";
import { AdminTemplateEventCreateScreen } from "#/screens/admin/templates/[templateId]/create-event/AdminTemplateEventCreateScreen";
import { requireAdminPageActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

type AdminTemplateEventCreatePageProps = {
  params: Promise<{ templateId: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminTemplateEventCreatePage({
  params,
}: AdminTemplateEventCreatePageProps) {
  await requireAdminPageActor();
  const { templateId } = await params;
  const client = createSupabaseAdminClient();
  const template = await readEventTemplateById(templateId, { client });

  if (!template) {
    notFound();
  }

  return <AdminTemplateEventCreateScreen template={template} />;
}
