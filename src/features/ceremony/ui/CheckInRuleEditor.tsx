"use client";

import { useState } from "react";

import type { SchedulePrepCheckInRule } from "@/entities/schedule/types/schedule-prep";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type CheckInRuleEditorProps = {
  rules: SchedulePrepCheckInRule[];
  onCreate: (input: { firstCeremonyAt: string; recommendedCheckIn: string }) => void;
  onUpdate: (input: { firstCeremonyAt: string; recommendedCheckIn: string }) => void;
  onDelete: (input: { firstCeremonyAt: string }) => void;
  pending: boolean;
};

function CheckInRuleRow({
  rule,
  onUpdate,
  onDelete,
  pending,
}: {
  rule: SchedulePrepCheckInRule;
  onUpdate: CheckInRuleEditorProps["onUpdate"];
  onDelete: CheckInRuleEditorProps["onDelete"];
  pending: boolean;
}) {
  const [recommendedCheckIn, setRecommendedCheckIn] = useState(rule.recommendedCheckIn);

  return (
    <li className="flex flex-wrap items-end gap-2">
      <Input label="첫 예식" type="time" value={rule.firstCeremonyAt} disabled />
      <Input
        label="추천 출근"
        type="time"
        value={recommendedCheckIn}
        onChange={(event) => setRecommendedCheckIn(event.target.value)}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => onUpdate({ firstCeremonyAt: rule.firstCeremonyAt, recommendedCheckIn })}
      >
        수정
      </Button>
      <Button
        type="button"
        variant="tertiary"
        disabled={pending}
        onClick={() => onDelete({ firstCeremonyAt: rule.firstCeremonyAt })}
      >
        삭제
      </Button>
    </li>
  );
}

export function CheckInRuleEditor({
  rules,
  onCreate,
  onUpdate,
  onDelete,
  pending,
}: CheckInRuleEditorProps) {
  const [newFirstCeremonyAt, setNewFirstCeremonyAt] = useState("");
  const [newRecommendedCheckIn, setNewRecommendedCheckIn] = useState("");

  return (
    <section className="flex flex-col gap-3">
      <h2 className="typo-title text-text-strong">체크인 규칙표</h2>
      <ul className="flex flex-col gap-3">
        {rules.map((rule) => (
          <CheckInRuleRow
            key={rule.firstCeremonyAt}
            rule={rule}
            onUpdate={onUpdate}
            onDelete={onDelete}
            pending={pending}
          />
        ))}
      </ul>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          label="첫 예식"
          type="time"
          value={newFirstCeremonyAt}
          onChange={(event) => setNewFirstCeremonyAt(event.target.value)}
        />
        <Input
          label="추천 출근"
          type="time"
          value={newRecommendedCheckIn}
          onChange={(event) => setNewRecommendedCheckIn(event.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={
            pending || newFirstCeremonyAt.length === 0 || newRecommendedCheckIn.length === 0
          }
          onClick={() => {
            onCreate({
              firstCeremonyAt: newFirstCeremonyAt,
              recommendedCheckIn: newRecommendedCheckIn,
            });
            setNewFirstCeremonyAt("");
            setNewRecommendedCheckIn("");
          }}
        >
          규칙 추가
        </Button>
      </div>
    </section>
  );
}
