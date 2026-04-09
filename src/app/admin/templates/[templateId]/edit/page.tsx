import { notFound } from "next/navigation";
import { readEventTemplates } from "#/entities/events/repositories/eventTemplateRepository";
import { readPositions } from "#/entities/positions/repositories/positionRepository";
import { AdminTemplateEditScreen } from "#/screens/admin/templates/[templateId]/edit/AdminTemplateEditScreen";

type AdminTemplateEditPageProps = {
  params: Promise<{ templateId: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminTemplateEditPage({
  params,
}: AdminTemplateEditPageProps) {
  const { templateId } = await params;
  const [templates, positions] = await Promise.all([
    readEventTemplates(),
    readPositions(),
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
