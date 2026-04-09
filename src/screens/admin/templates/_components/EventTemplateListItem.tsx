import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import { Card, CardContent } from "#/shared/components/ui/card";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";

type EventTemplateListItemProps = {
  deletePending: boolean;
  isEditing: boolean;
  isHighlighted: boolean;
  onDelete: (template: EventTemplate) => void;
  onEdit: (template: EventTemplate) => void;
  template: EventTemplate;
};

export function EventTemplateListItem({
  deletePending,
  isEditing,
  isHighlighted,
  onDelete,
  onEdit,
  template,
}: Readonly<EventTemplateListItemProps>) {
  return (
    <Card
      className={
        isHighlighted
          ? "border-[#9ac2ff] bg-[#f5faff] shadow-[0_16px_38px_rgba(43,127,255,0.12)]"
          : "bg-white"
      }
    >
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {template.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-subtle)]">
              {template.timeLabel}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge>
              {isEditing
                ? "수정 중"
                : isHighlighted
                  ? "방금 저장됨"
                  : "저장됨"}
            </Badge>
            <Button
              className="h-auto p-0 text-[var(--text-muted)] underline underline-offset-4 hover:text-[var(--foreground)]"
              onClick={() => onEdit(template)}
              type="button"
              variant="link"
            >
              수정
            </Button>
            <Button
              className="h-auto p-0 text-[var(--foreground)] hover:bg-transparent hover:text-[var(--foreground)] hover:underline hover:underline-offset-4"
              disabled={deletePending}
              onClick={() => onDelete(template)}
              type="button"
              variant="ghost"
            >
              삭제
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {template.slotDefaults.map((slot) => (
            <Badge key={`${template.id}-${slot.positionId}`} variant="secondary">
              {slot.positionName} / 필수 {slot.requiredCount} / 교육{" "}
              {slot.trainingCount}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
