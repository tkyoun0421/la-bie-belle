import { readEventTemplates } from "#/entities/events/repositories/eventTemplateRepository";
import { readPositions } from "#/entities/positions/repositories/positionRepository";
import { AdminTemplateCreateScreen } from "#/screens/admin/templates/new/AdminTemplateCreateScreen";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminTemplateCreatePage() {
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
