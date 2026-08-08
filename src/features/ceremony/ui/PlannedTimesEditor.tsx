"use client";

import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type PlannedTimesEditorProps = {
  plannedCheckin: string | null;
  plannedCheckout: string | null;
  onSave: (checkin: string, checkout: string) => void;
  saving: boolean;
};

export function PlannedTimesEditor({
  plannedCheckin,
  plannedCheckout,
  onSave,
  saving,
}: PlannedTimesEditorProps) {
  const [committedCheckin, setCommittedCheckin] = useState(plannedCheckin);
  const [committedCheckout, setCommittedCheckout] = useState(plannedCheckout);
  const [checkin, setCheckin] = useState(plannedCheckin ?? "");
  const [checkout, setCheckout] = useState(plannedCheckout ?? "");

  if (plannedCheckin !== committedCheckin) {
    setCommittedCheckin(plannedCheckin);
    setCheckin(plannedCheckin ?? "");
  }
  if (plannedCheckout !== committedCheckout) {
    setCommittedCheckout(plannedCheckout);
    setCheckout(plannedCheckout ?? "");
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="typo-title text-text-strong">예정 출퇴근</h2>
      <div className="flex gap-2">
        <Input
          label="예정 출근"
          type="time"
          value={checkin}
          onChange={(event) => setCheckin(event.target.value)}
        />
        <Input
          label="예정 퇴근"
          type="time"
          value={checkout}
          onChange={(event) => setCheckout(event.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={() => onSave(checkin, checkout)}
        loading={saving}
        disabled={saving || checkin.length === 0 || checkout.length === 0}
      >
        예정 시각 저장
      </Button>
    </section>
  );
}
