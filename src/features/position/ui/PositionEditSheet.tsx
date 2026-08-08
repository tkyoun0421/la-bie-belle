"use client";

import {
  GENDER_REQUIREMENT_VALUES,
  isSystemPosition,
  type GenderRequirement,
  type Position,
} from "@/entities/position/model/position";
import type { PositionFormValues } from "@/features/position/hooks/usePositionEditor";
import { Badge } from "@/shared/ui/badge";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { Input } from "@/shared/ui/input";
import { SelectField } from "@/shared/ui/select-field";

const GENDER_LABELS: Record<GenderRequirement, string> = {
  any: "무관",
  male: "남성만",
  female: "여성만",
};

const GENDER_OPTIONS = GENDER_REQUIREMENT_VALUES.map((value) => ({
  value,
  label: GENDER_LABELS[value],
}));

type PositionEditSheetProps = {
  editing: Position | "new" | null;
  form: PositionFormValues;
  pending: boolean;
  onClose: () => void;
  onUpdateField: <K extends keyof PositionFormValues>(
    field: K,
    value: PositionFormValues[K],
  ) => void;
  onSave: () => void;
  onRemove: () => void;
};

export function PositionEditSheet({
  editing,
  form,
  pending,
  onClose,
  onUpdateField,
  onSave,
  onRemove,
}: PositionEditSheetProps) {
  const isSystem = editing !== null && editing !== "new" && isSystemPosition(editing);

  return (
    <BottomSheet
      open={editing !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={editing === "new" ? "포지션 추가" : "포지션 수정"}
    >
      <div className="flex flex-col gap-4 pb-6">
        {isSystem ? <Badge tone="neutral">시스템 포지션 — 보호됨</Badge> : null}
        <Input
          label="이름"
          value={form.name}
          onChange={(event) => onUpdateField("name", event.target.value)}
          disabled={isSystem}
          disabledReason={isSystem ? "시스템 포지션 이름은 바꿀 수 없어요" : undefined}
        />
        <Input
          label="기본 필요 인원"
          type="number"
          inputMode="numeric"
          min={0}
          value={form.defaultRequiredCount}
          onChange={(event) => onUpdateField("defaultRequiredCount", Number(event.target.value))}
        />
        <SelectField
          label="성별 조건"
          value={form.genderRequirement}
          options={GENDER_OPTIONS}
          onChange={(value) => onUpdateField("genderRequirement", value as GenderRequirement)}
        />
        <div className="flex flex-col gap-1.5">
          <span className="typo-label text-text">기본 포지션</span>
          <Chip
            selected={form.isDefault}
            onSelectedChange={(value) => onUpdateField("isDefault", value)}
          >
            {form.isDefault ? "기본 적용" : "선택 적용"}
          </Chip>
        </div>
        {editing !== "new" ? (
          <div className="flex flex-col gap-1.5">
            <span className="typo-label text-text">상태</span>
            <Chip
              selected={form.isActive}
              disabled={isSystem}
              onSelectedChange={(value) => onUpdateField("isActive", value)}
            >
              {form.isActive ? "활성" : "비활성"}
            </Chip>
          </div>
        ) : null}
        <Button variant="primary" loading={pending} disabled={pending} onClick={onSave}>
          저장
        </Button>
        {editing !== "new" ? (
          <Button
            variant="destructive"
            loading={pending}
            disabled={pending || isSystem}
            disabledReason={isSystem ? "시스템 포지션은 삭제할 수 없어요" : undefined}
            onClick={onRemove}
          >
            삭제
          </Button>
        ) : null}
      </div>
    </BottomSheet>
  );
}
