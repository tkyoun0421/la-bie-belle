import Link from "next/link";
import { Button } from "#/shared/components/ui/button";
import { Card, CardContent } from "#/shared/components/ui/card";
import { Input } from "#/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/shared/components/ui/select";
import type {
  TemplateFormSlot,
  TemplatePositionOption,
  TemplateSlotRow,
} from "#/screens/admin/templates/_helpers/templateForm";
import { TemplateField } from "#/screens/admin/templates/_components/TemplateField";

type TemplateSlotDefaultsSectionProps = {
  canManageSlots: boolean;
  onAddSlotRow: () => void;
  onRemoveSlotRow: (slotIndex: number) => void;
  onUpdateSlot: (
    slotIndex: number,
    field: keyof TemplateFormSlot,
    nextValue: string
  ) => void;
  positionOptions: TemplatePositionOption[];
  slotRows: TemplateSlotRow[];
};

export function TemplateSlotDefaultsSection({
  canManageSlots,
  onAddSlotRow,
  onRemoveSlotRow,
  onUpdateSlot,
  positionOptions,
  slotRows,
}: Readonly<TemplateSlotDefaultsSectionProps>) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">
            슬롯 기본값
          </h3>
          <p className="text-sm text-[var(--text-subtle)]">
            행사 생성 시 그대로 복사되는 포지션별 기본 인원입니다.
          </p>
        </div>
        <Button
          disabled={!canManageSlots}
          onClick={onAddSlotRow}
          type="button"
          variant="outline"
        >
          슬롯 추가
        </Button>
      </div>

      <div className="flex justify-end">
        <Link
          className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
          href="/admin/positions"
        >
          포지션 관리 화면으로 가기
        </Link>
      </div>

      <div className="grid gap-3">
        {slotRows.map((slot, index) => (
          <Card className="bg-[var(--surface-soft)] shadow-none" key={slot._key}>
            <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1.2fr)_140px_140px_auto]">
              <TemplateField label="포지션">
                <Select
                  onValueChange={(value) => onUpdateSlot(index, "positionId", value)}
                  value={slot.positionId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="포지션 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((position) => (
                      <SelectItem key={position.value} value={position.value}>
                        {position.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TemplateField>

              <TemplateField label="필수 인원">
                <Input
                  min="1"
                  onChange={(event) =>
                    onUpdateSlot(index, "requiredCount", event.target.value)
                  }
                  type="number"
                  value={slot.requiredCount}
                />
              </TemplateField>

              <TemplateField label="교육 인원">
                <Input
                  min="0"
                  onChange={(event) =>
                    onUpdateSlot(index, "trainingCount", event.target.value)
                  }
                  type="number"
                  value={slot.trainingCount}
                />
              </TemplateField>

              <div className="flex items-end">
                <Button
                  className="text-[var(--foreground)]"
                  onClick={() => onRemoveSlotRow(index)}
                  type="button"
                  variant="outline"
                >
                  제거
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
