import type { Position } from "#/entities/positions/models/schemas/position";
import { TemplateEditorPageSection } from "#/screens/admin/templates/_components/TemplateEditorPageSection";

type AdminTemplateCreateScreenProps = {
  positions: Position[];
  templatesCount: number;
};

export function AdminTemplateCreateScreen({
  positions,
  templatesCount,
}: Readonly<AdminTemplateCreateScreenProps>) {
  return (
    <TemplateEditorPageSection
      description="새 행사 템플릿을 만들고 포지션 기본값을 바로 구성합니다. 저장하면 목록으로 돌아가며 결과가 바로 반영됩니다."
      eyebrow="Admin / Templates / New"
      initialTemplate={null}
      positions={positions}
      templatesCount={templatesCount}
      title="새 템플릿을 만듭니다."
    />
  );
}
