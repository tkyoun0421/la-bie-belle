"use client";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type CeremonyListEditorProps = {
  ceremonyTimes: string[];
  onUpdateTime: (index: number, value: string) => void;
  onAddTime: () => void;
  onRemoveTime: (index: number) => void;
  onSave: () => void;
  saving: boolean;
};

export function CeremonyListEditor({
  ceremonyTimes,
  onUpdateTime,
  onAddTime,
  onRemoveTime,
  onSave,
  saving,
}: CeremonyListEditorProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="typo-title text-text-strong">예식 시간</h2>
      <ul className="flex flex-col gap-3">
        {ceremonyTimes.map((time, index) => (
          <li key={index} className="flex flex-wrap items-end gap-2">
            <Input
              label={`예식 ${index + 1}`}
              type="time"
              value={time}
              onChange={(event) => onUpdateTime(index, event.target.value)}
            />
            <Button type="button" variant="tertiary" onClick={() => onRemoveTime(index)}>
              삭제
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" onClick={onAddTime}>
        예식 추가
      </Button>
      <Button type="button" variant="primary" onClick={onSave} loading={saving} disabled={saving}>
        저장
      </Button>
    </section>
  );
}
