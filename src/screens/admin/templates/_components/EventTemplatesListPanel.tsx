import { Button } from "#/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";
import { Input } from "#/shared/components/ui/input";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { EventTemplateListItem } from "#/screens/admin/templates/_components/EventTemplateListItem";

type EventTemplatesListPanelProps = {
  deletePending: boolean;
  editingTemplateId: string | null;
  highlightedTemplateId: string | null;
  onCreate: () => void;
  onDelete: (template: EventTemplate) => void;
  onEdit: (template: EventTemplate) => void;
  onSearchTermChange: (value: string) => void;
  searchTerm: string;
  templates: EventTemplate[];
};

export function EventTemplatesListPanel({
  deletePending,
  editingTemplateId,
  highlightedTemplateId,
  onCreate,
  onDelete,
  onEdit,
  onSearchTermChange,
  searchTerm,
  templates,
}: Readonly<EventTemplatesListPanelProps>) {
  return (
    <Card>
      <CardHeader className="flex-row items-end justify-between gap-4">
        <div>
          <CardTitle>템플릿 목록</CardTitle>
          <CardDescription>
            저장된 템플릿과 슬롯 기본값을 확인하고 수정할 수 있습니다.
          </CardDescription>
        </div>
        <Button onClick={onCreate} type="button">
          새 템플릿 추가
        </Button>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label
            className="text-sm font-semibold text-[var(--foreground)]"
            htmlFor="template-search"
          >
            목록 검색
          </label>
          <Input
            id="template-search"
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="템플릿 이름 또는 포지션 이름"
            value={searchTerm}
          />
        </div>

        <div className="grid gap-3">
          {templates.map((template) => (
            <EventTemplateListItem
              deletePending={deletePending}
              isEditing={template.id === editingTemplateId}
              isHighlighted={template.id === highlightedTemplateId}
              key={template.id}
              onDelete={onDelete}
              onEdit={onEdit}
              template={template}
            />
          ))}

          {templates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] px-5 py-8 text-center text-sm text-[var(--text-subtle)]">
              아직 템플릿이 없거나 검색 결과가 없습니다.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
