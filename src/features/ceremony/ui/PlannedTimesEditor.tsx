"use client";

import { useState } from "react";

import type { PendingRecommendation } from "@/features/ceremony/hooks/useCeremonyEditor";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const NO_RULE_CHECKIN_PREVIEW = "추천 — 규칙표가 비어 있어 직접 입력이 필요해요";

type PlannedTimesEditorProps = {
  plannedCheckin: string | null;
  plannedCheckout: string | null;
  recommendationPreview: PendingRecommendation | null;
  onSave: (checkin: string, checkout: string) => void;
  saving: boolean;
};

function checkinPreviewText(recommendationPreview: PendingRecommendation | null) {
  if (recommendationPreview === null) {
    return undefined;
  }
  if (recommendationPreview.checkin === null) {
    return NO_RULE_CHECKIN_PREVIEW;
  }
  return `추천 ${recommendationPreview.checkin}`;
}

function checkoutPreviewText(recommendationPreview: PendingRecommendation | null) {
  if (recommendationPreview === null) {
    return undefined;
  }
  const cappedSuffix = recommendationPreview.checkout.capped ? " (자정 캡)" : "";
  return `추천 ${recommendationPreview.checkout.time}${cappedSuffix}`;
}

export function PlannedTimesEditor({
  plannedCheckin,
  plannedCheckout,
  recommendationPreview,
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
          helperText={checkinPreviewText(recommendationPreview)}
        />
        <Input
          label="예정 퇴근"
          type="time"
          value={checkout}
          onChange={(event) => setCheckout(event.target.value)}
          helperText={checkoutPreviewText(recommendationPreview)}
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
