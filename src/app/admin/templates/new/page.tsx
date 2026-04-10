import { readPositions } from "#/entities/positions/repositories/readPositionRepository";
import { countEventTemplateRecords } from "#/entities/events/repositories/writeEventTemplateRepository";
import { AdminTemplateCreateScreen } from "#/screens/admin/templates/new/AdminTemplateCreateScreen";
import { requireAdminPageActor } from "#/shared/lib/auth/adminActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminTemplateCreatePage() {
  await requireAdminPageActor();
  const client = createSupabaseAdminClient();
  const [templatesCount, positions] = await Promise.all([
    countEventTemplateRecords({ client }),
    readPositions({ client }),
  ]);

  return (
    <AdminTemplateCreateScreen
      positions={positions}
      templatesCount={templatesCount}
    />
  );
}
