import { GripVertical } from "lucide-react";
import { formatPositionAllowedGenderLabel } from "#/entities/positions/models/constants/allowedGender";
import type { Position } from "#/entities/positions/models/schemas/position";
import { ReorderDropIndicator } from "#/shared/components/drag-and-drop/ReorderDropIndicator";
import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";
import { Input } from "#/shared/components/ui/input";
import { getReorderDropIndicatorPosition } from "#/shared/lib/drag-and-drop/getReorderDropIndicatorPosition";
import { setDragPreview } from "#/shared/lib/drag-and-drop/setDragPreview";
import { cn } from "#/shared/lib/utils";

type PositionsListPanelProps = {
  canReorder: boolean;
  draggingPositionId: string | null;
  dropTargetPositionId: string | null;
  isDeleting: boolean;
  isReordering: boolean;
  isSearchActive: boolean;
  positions: Position[];
  searchTerm: string;
  totalCount: number;
  onCreate: () => void;
  onDelete: (position: Position) => void;
  onDragEnd: () => void;
  onDragStart: (positionId: string) => void;
  onDrop: (positionId: string) => void;
  onDropTargetChange: (positionId: string) => void;
  onEdit: (position: Position) => void;
  onSearchTermChange: (value: string) => void;
};

export function PositionsListPanel({
  canReorder,
  draggingPositionId,
  dropTargetPositionId,
  isDeleting,
  isReordering,
  isSearchActive,
  positions,
  searchTerm,
  totalCount,
  onCreate,
  onDelete,
  onDragEnd,
  onDragStart,
  onDrop,
  onDropTargetChange,
  onEdit,
  onSearchTermChange,
}: Readonly<PositionsListPanelProps>) {
  const draggingPositionIndex = draggingPositionId
    ? positions.findIndex((position) => position.id === draggingPositionId)
    : -1;
  const dropTargetPositionIndex = dropTargetPositionId
    ? positions.findIndex((position) => position.id === dropTargetPositionId)
    : -1;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>포지션 목록</CardTitle>
          <CardDescription>
            현재 등록된 포지션과 기본 필수 인원입니다. 검색어가 비어 있으면
            드래그로 순서를 바꿀 수 있습니다.
          </CardDescription>
        </div>
        <div className="flex self-end items-center gap-4">
          <strong className="text-sm font-semibold text-[var(--text-subtle)]">
            총 {totalCount}개
          </strong>
          <Button onClick={onCreate} type="button">
            새 포지션 추가
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label
            className="text-sm font-semibold text-[var(--foreground)]"
            htmlFor="position-search"
          >
            목록 검색
          </label>
          <Input
            id="position-search"
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="포지션 이름 또는 성별"
            value={searchTerm}
          />
          {isSearchActive ? (
            <p className="text-xs text-[var(--text-muted)]">
              검색 중에는 순서 변경이 비활성화됩니다.
            </p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              왼쪽 핸들을 잡고 드래그해 순서를 바꿔 보세요.
            </p>
          )}
        </div>

        <div className="grid gap-3">
          {positions.map((position) => {
            const isDragging = draggingPositionId === position.id;
            const isDropTarget = dropTargetPositionId === position.id;
            const dropIndicatorPosition = isDropTarget
              ? getReorderDropIndicatorPosition(
                  draggingPositionIndex,
                  dropTargetPositionIndex
                )
              : null;

            return (
              <Card
                className={cn(
                  "relative transition-opacity transition-transform",
                  isDropTarget &&
                    "z-[1] border-[#9ac2ff] bg-[#f5faff] ring-2 ring-inset ring-[#9ac2ff] shadow-none",
                  !isDropTarget && "bg-white shadow-none",
                  isDragging && "scale-[0.99] opacity-45"
                )}
                data-drag-preview
                key={position.id}
                onDragOver={(event) => {
                  if (!canReorder) {
                    return;
                  }

                  event.preventDefault();
                  onDropTargetChange(position.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  onDrop(position.id);
                }}
              >
                {dropIndicatorPosition ? (
                  <ReorderDropIndicator position={dropIndicatorPosition} />
                ) : null}

                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        aria-label={`${position.name} 순서 이동`}
                        className="mt-0.5 inline-flex size-8 cursor-grab items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] active:cursor-grabbing"
                        disabled={!canReorder || isReordering}
                        draggable={canReorder && !isReordering}
                        onDragEnd={onDragEnd}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", position.id);
                          setDragPreview(event);
                          onDragStart(position.id);
                        }}
                        type="button"
                      >
                        <GripVertical className="size-4" />
                      </button>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--foreground)]">
                          {position.name}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--text-subtle)]">
                          기본 필수 {position.defaultRequiredCount}명
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        className="h-auto p-0 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:underline hover:underline-offset-4"
                        onClick={() => onEdit(position)}
                        type="button"
                        variant="link"
                      >
                        수정
                      </Button>
                      <Button
                        className="h-auto p-0 text-[var(--foreground)] hover:bg-transparent hover:text-[var(--foreground)] hover:underline hover:underline-offset-4"
                        disabled={isDeleting}
                        onClick={() => onDelete(position)}
                        type="button"
                        variant="ghost"
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {formatPositionAllowedGenderLabel(position.allowedGender)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {positions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] px-5 py-8 text-center text-sm text-[var(--text-subtle)]">
              아직 포지션이 없거나 검색 결과가 없습니다.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
