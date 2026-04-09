import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import type { Position } from "#/entities/positions/models/schemas/position";
import { TemplateEditorPageSection } from "#/screens/admin/templates/_components/TemplateEditorPageSection";

type AdminTemplateEditScreenProps = {
  positions: Position[];
  template: EventTemplate;
  templatesCount: number;
};

export function AdminTemplateEditScreen({
  positions,
  template,
  templatesCount,
}: Readonly<AdminTemplateEditScreenProps>) {
  return (
    <TemplateEditorPageSection
      description="템플릿 이름, 서비스 시간, 포지션 기본 구성을 수정합니다. 저장하면 목록으로 돌아가며 최신 값이 바로 보입니다."
      eyebrow="Admin / Templates / Edit"
      initialTemplate={template}
      positions={positions}
      templatesCount={templatesCount}
      title={`"${template.name}" 템플릿을 수정합니다.`}
    />
  );
}
