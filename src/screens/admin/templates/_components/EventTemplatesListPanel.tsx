import Link from "next/link";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { EventTemplateListItem } from "#/screens/admin/templates/_components/EventTemplateListItem";
import { Button } from "#/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";
import { Input } from "#/shared/components/ui/input";

type EventTemplatesListPanelProps = {
  deletePending: boolean;
  highlightedTemplateId: string | null;
  onDelete: (template: EventTemplate) => void;
  onSearchTermChange: (value: string) => void;
  queryError: string | null;
  searchTerm: string;
  templates: EventTemplate[];
};

export function EventTemplatesListPanel({
  deletePending,
  highlightedTemplateId,
  onDelete,
  onSearchTermChange,
  queryError,
  searchTerm,
  templates,
}: Readonly<EventTemplatesListPanelProps>) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>템플릿 목록</CardTitle>
          <CardDescription>
            등록한 템플릿과 포지션 기본 구성을 확인하고 수정할 수 있습니다.
            대표 템플릿은 목록 상단에 먼저 정렬됩니다.
          </CardDescription>
        </div>
        <Button
          asChild
          className="self-end !text-[var(--primary-foreground)] hover:!text-[var(--primary-foreground)]"
          type="button"
        >
          <Link href="/admin/templates/new" prefetch={false}>
            새 템플릿 추가
          </Link>
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
          {queryError ? (
            <p className="text-sm font-medium text-[var(--destructive)]">
              {queryError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3">
          {templates.map((template) => (
            <EventTemplateListItem
              canDelete={!template.isPrimary}
              createEventHref={`/admin/templates/${template.id}/create-event`}
              deletePending={deletePending}
              editHref={`/admin/templates/${template.id}/edit`}
              isHighlighted={template.id === highlightedTemplateId}
              key={template.id}
              onDelete={onDelete}
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
