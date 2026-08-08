import { useMemo, useState, useTransition } from "react";

import {
  generateCeremonyTimes,
  recommendCheckIn,
  recommendCheckOut,
  sortCeremonyTimes,
  type CheckInRule,
  type CheckOutRecommendation,
} from "@/entities/schedule/model/ceremony-times";
import { ERROR_CODES, type ErrorCode } from "@/shared/config/error-codes.config";
import { showSnackbar } from "@/shared/ui/snackbar";

const MIDNIGHT_CROSSING_MESSAGE =
  "자정을 넘는 예식은 생성할 수 없어요. 개수나 첫 시각을 줄여 주세요";

export type CeremonyEditorInitial = {
  scheduleId: string;
  ceremonyTimes: string[];
  plannedCheckin: string | null;
  plannedCheckout: string | null;
  checkInRules: CheckInRule[];
};

export type ReplaceCeremoniesOutcome =
  { ok: true; ceremonyTimes: string[]; changed: boolean } | { ok: false; code: ErrorCode };

export type SetPlannedTimesOutcome = { ok: true } | { ok: false; code: ErrorCode };

export type ReplaceCeremoniesAction = (input: {
  scheduleId: string;
  ceremonyTimes: string[];
}) => Promise<ReplaceCeremoniesOutcome>;

export type SetPlannedTimesAction = (input: {
  scheduleId: string;
  checkin: string;
  checkout: string;
}) => Promise<SetPlannedTimesOutcome>;

export type PendingRecommendation = {
  checkin: string | null;
  checkout: CheckOutRecommendation;
};

function firstAndLast(times: string[]): { first: string | null; last: string | null } {
  return { first: times[0] ?? null, last: times[times.length - 1] ?? null };
}

export function useCeremonyEditor(
  initial: CeremonyEditorInitial,
  onReplaceCeremonies: ReplaceCeremoniesAction,
  onSetPlannedTimes: SetPlannedTimesAction,
) {
  const [ceremonyTimes, setCeremonyTimes] = useState(initial.ceremonyTimes);
  const [savedCeremonyTimes, setSavedCeremonyTimes] = useState(initial.ceremonyTimes);
  const [plannedCheckin, setPlannedCheckin] = useState(initial.plannedCheckin);
  const [plannedCheckout, setPlannedCheckout] = useState(initial.plannedCheckout);
  const [pendingRecommendation, setPendingRecommendation] = useState<PendingRecommendation | null>(
    null,
  );
  const [saving, startTransition] = useTransition();

  const recommendationPreview = useMemo<PendingRecommendation | null>(() => {
    const { first, last } = firstAndLast(sortCeremonyTimes(ceremonyTimes));
    if (first === null || last === null) {
      return null;
    }
    return {
      checkin: recommendCheckIn(initial.checkInRules, first),
      checkout: recommendCheckOut(last),
    };
  }, [ceremonyTimes, initial.checkInRules]);

  function updateCeremonyTime(index: number, value: string) {
    setCeremonyTimes((prev) => prev.map((time, position) => (position === index ? value : time)));
  }

  function addCeremonyTime(value: string) {
    setCeremonyTimes((prev) => [...prev, value]);
  }

  function removeCeremonyTime(index: number) {
    setCeremonyTimes((prev) => prev.filter((_, position) => position !== index));
  }

  function generateFromCount(count: number, firstCeremonyTime: string) {
    const generated = generateCeremonyTimes(count, firstCeremonyTime);
    if (generated === null) {
      showSnackbar(MIDNIGHT_CROSSING_MESSAGE);
      return;
    }
    setCeremonyTimes(generated);
  }

  function saveCeremonies() {
    startTransition(async () => {
      const sortedDraft = sortCeremonyTimes(ceremonyTimes);
      const result = await onReplaceCeremonies({
        scheduleId: initial.scheduleId,
        ceremonyTimes: sortedDraft,
      });

      if (!result.ok) {
        showSnackbar(ERROR_CODES[result.code].message);
        return;
      }

      setCeremonyTimes(result.ceremonyTimes);

      const previous = firstAndLast(savedCeremonyTimes);
      const next = firstAndLast(result.ceremonyTimes);
      setSavedCeremonyTimes(result.ceremonyTimes);

      if (next.first === null) {
        return;
      }
      if (next.first === previous.first && next.last === previous.last) {
        return;
      }

      setPendingRecommendation({
        checkin: recommendCheckIn(initial.checkInRules, next.first),
        checkout: recommendCheckOut(next.last as string),
      });
    });
  }

  function confirmRecommendation() {
    if (pendingRecommendation === null || pendingRecommendation.checkin === null) {
      setPendingRecommendation(null);
      return;
    }
    const checkin = pendingRecommendation.checkin;
    const checkout = pendingRecommendation.checkout.time;
    startTransition(async () => {
      const result = await onSetPlannedTimes({ scheduleId: initial.scheduleId, checkin, checkout });
      if (!result.ok) {
        showSnackbar(ERROR_CODES[result.code].message);
        setPendingRecommendation(null);
        return;
      }
      setPlannedCheckin(checkin);
      setPlannedCheckout(checkout);
      setPendingRecommendation(null);
    });
  }

  function dismissRecommendation() {
    setPendingRecommendation(null);
  }

  function savePlannedTimesManually(checkin: string, checkout: string) {
    startTransition(async () => {
      const result = await onSetPlannedTimes({ scheduleId: initial.scheduleId, checkin, checkout });
      if (!result.ok) {
        showSnackbar(ERROR_CODES[result.code].message);
        return;
      }
      setPlannedCheckin(checkin);
      setPlannedCheckout(checkout);
    });
  }

  return {
    ceremonyTimes,
    plannedCheckin,
    plannedCheckout,
    pendingRecommendation,
    recommendationPreview,
    saving,
    updateCeremonyTime,
    addCeremonyTime,
    removeCeremonyTime,
    generateFromCount,
    saveCeremonies,
    confirmRecommendation,
    dismissRecommendation,
    savePlannedTimesManually,
  };
}
