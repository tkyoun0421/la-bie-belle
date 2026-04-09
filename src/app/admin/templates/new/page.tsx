import { readEventTemplates } from "#/entities/events/repositories/eventTemplateRepository";
import { readPositions } from "#/entities/positions/repositories/positionRepository";
import { AdminTemplateCreateScreen } from "#/screens/admin/templates/new/AdminTemplateCreateScreen";

export const dynamic = "force-dynamic";

export default async function AdminTemplateCreatePage() {
  const [templates, positions] = await Promise.all([
    readEventTemplates(),
    readPositions(),
  ]);

  return (
    <AdminTemplateCreateScreen
      positions={positions}
      templatesCount={templates.length}
    />
  );
}
