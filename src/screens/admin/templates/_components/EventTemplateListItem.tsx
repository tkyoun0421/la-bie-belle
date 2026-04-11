import Link from "next/link";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import { Card, CardContent } from "#/shared/components/ui/card";
import { cn } from "#/shared/lib/utils";

type EventTemplateListItemProps = {
  canDelete: boolean;
  createEventHref: string;
  deletePending: boolean;
  editHref: string;
  isHighlighted: boolean;
  onDelete: (template: EventTemplate) => void;
  template: EventTemplate;
};

export function EventTemplateListItem({
  canDelete,
  createEventHref,
  deletePending,
  editHref,
  isHighlighted,
  onDelete,
  template,
}: Readonly<EventTemplateListItemProps>) {
  return (
    <Card
      className={cn(
        "relative overflow-visible border-[var(--border-soft)] bg-white transition-colors",
        template.isPrimary &&
          "border-2 border-[var(--primary)] bg-white shadow-[0_12px_30px_rgba(43,127,255,0.10)]",
        isHighlighted &&
          "bg-[#f5faff] shadow-[0_16px_38px_rgba(43,127,255,0.12)]",
        isHighlighted && template.isPrimary && "border-[#2b7fff]"
      )}
    >
      {template.isPrimary ? (
        <div className="pointer-events-none absolute top-0 left-4 -translate-y-1/2 rounded-md border-2 border-[var(--primary)] bg-[var(--primary)] px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
          대표 템플릿
        </div>
      ) : null}

      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-2">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {template.name}
            </h3>
            <p className="text-sm text-[var(--text-subtle)]">
              {template.timeLabel}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild size="sm" type="button" variant="secondary">
              <Link href={createEventHref} prefetch={false}>
                행사 생성
              </Link>
            </Button>
            <Link
              className="group inline-flex h-auto items-center justify-center p-0 text-sm font-medium"
              href={editHref}
              prefetch={false}
            >
              <span className="text-muted-foreground underline-offset-4 transition-colors group-hover:text-foreground group-hover:underline">
                수정
              </span>
            </Link>
            {canDelete ? (
              <Button
                className="h-auto p-0 text-[var(--foreground)] hover:bg-transparent hover:text-[var(--foreground)] hover:underline hover:underline-offset-4"
                disabled={deletePending}
                onClick={() => onDelete(template)}
                type="button"
                variant="ghost"
              >
                삭제
              </Button>
            ) : (
              <span className="text-sm font-medium text-[var(--text-muted)]">
                삭제 불가
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {template.slotDefaults.map((slot) => (
            <Badge key={`${template.id}-${slot.positionId}`} variant="secondary">
              {slot.positionName} / 필수 {slot.requiredCount}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
