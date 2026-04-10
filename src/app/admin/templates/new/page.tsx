import { readEventTemplates } from "#/entities/events/repositories/readEventTemplateRepository";
import { readPositions } from "#/entities/positions/repositories/readPositionRepository";
import { AdminTemplateCreateScreen } from "#/screens/admin/templates/new/AdminTemplateCreateScreen";
import { requireAdminPageActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminTemplateCreatePage() {
  await requireAdminPageActor();
  const client = createSupabaseAdminClient();
  const [templates, positions] = await Promise.all([
    readEventTemplates({ client }),
    readPositions({ client }),
  ]);

  return (
    <AdminTemplateCreateScreen
      positions={positions}
      templatesCount={templates.length}
    />
  );
}
