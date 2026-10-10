import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { spellWon } from "@/shared/utils/spellNumber";
import type { MemberWageRate } from "@/entities/payroll/model/payroll.type";
import {
  WAGE_CAP_HINT,
  WAGE_SAVE_FAILED_TITLE,
  WAGE_SHEET_COPY,
} from "@/features/wageAdmin/consts/wageAdmin.const";
import { canResetToDefault } from "@/features/wageAdmin/model/canResetToDefault.policy";
import {
  atWageCap,
  canSaveWage,
  formatAmountDisplay,
  nextAmountDigits,
} from "@/features/wageAdmin/model/wageAmount.policy";
import { isNoDefaultWage } from "@/features/wageAdmin/model/wageError.policy";
import { useResetWageToDefaultMutation } from "@/features/wageAdmin/services/useResetWageToDefaultMutation";
import { useSetWageMutation } from "@/features/wageAdmin/services/useSetWageMutation";
import {
  buildWageHistory,
  prefillWageAmount,
  spellWageDate,
} from "@/features/wageAdmin/utils/wageHistory.utils";

export type MemberWageSheetInput = {
  profileId: string;
  name: string;
  photoUrl: string | null;
  rates: readonly MemberWageRate[];
  hasDefaultWage: boolean;
  defaultWage: number | null;
  onDone: (message: string) => void;
};

export type MemberWageHistoryRow = {
  key: string;
  dateLabel: string;
  amountLabel: string;
};

export type MemberWageSheetController = {
  name: string;
  photoUrl: string | null;
  historyRows: MemberWageHistoryRow[];
  historyHasMore: boolean;
  amountText: string;
  capHint: string | undefined;
  canSave: boolean;
  canReset: boolean;
  sending: boolean;
  failedLine: string | null;
  asking: boolean;
  resetBody: string | undefined;
  resetNotice: string | undefined;
  write: (typed: string) => void;
  expandHistory: () => void;
  askReset: () => void;
  cancelReset: () => void;
  confirmReset: () => void;
  save: () => void;
};

export function useMemberWageSheet({
  profileId,
  name,
  photoUrl,
  rates,
  hasDefaultWage,
  defaultWage,
  onDone,
}: MemberWageSheetInput): MemberWageSheetController {
  const current = prefillWageAmount(rates, kstToday());

  const [digits, setDigits] = useState(current === null ? "" : String(current));
  const [expanded, setExpanded] = useState(false);
  const [asking, setAsking] = useState(false);

  const {
    mutate: saveWage,
    isPending,
    isSuccess: wageSaved,
    error: wageError,
  } = useSetWageMutation(supabase);

  const {
    mutate: sendReset,
    isSuccess: resetDone,
    error: resetError,
    reset: resetResetSend,
  } = useResetWageToDefaultMutation(supabase);

  useEffect(() => {
    if (wageSaved) {
      onDone(WAGE_SHEET_COPY.wageChanged);
    }
  }, [wageSaved, onDone]);

  useEffect(() => {
    if (resetDone) {
      onDone(WAGE_SHEET_COPY.resetDone);
    }
  }, [resetDone, onDone]);

  const history = buildWageHistory(rates, expanded);

  const write = useCallback(
    (typed: string) => setDigits((kept) => nextAmountDigits(kept, typed)),
    [],
  );

  const cancelReset = useCallback(() => {
    setAsking(false);
    resetResetSend();
  }, [resetResetSend]);

  const confirmReset = useCallback(() => {
    sendReset(profileId);
  }, [sendReset, profileId]);

  const save = useCallback(() => {
    if (canSaveWage(digits, current)) {
      saveWage({ profileId, amount: Number(digits) });
    }
  }, [digits, current, saveWage, profileId]);

  return {
    name,
    photoUrl,
    historyRows: history.rows.map((row) => ({
      key: row.effectiveDate,
      dateLabel: spellWageDate(row.effectiveDate),
      amountLabel: spellWon(row.amount),
    })),
    historyHasMore: history.hasMore,
    amountText: formatAmountDisplay(digits),
    capHint: atWageCap(digits) ? WAGE_CAP_HINT : undefined,
    canSave: canSaveWage(digits, current),
    canReset: canResetToDefault(rates, hasDefaultWage),
    sending: isPending,
    failedLine: wageError === null ? null : WAGE_SAVE_FAILED_TITLE,
    asking,
    resetBody:
      defaultWage === null
        ? undefined
        : `${WAGE_SHEET_COPY.resetBodyPrefix}${spellWon(defaultWage)}${WAGE_SHEET_COPY.resetBodySuffix}`,
    resetNotice: isNoDefaultWage(resetError)
      ? WAGE_SHEET_COPY.noDefaultWageNotice
      : undefined,
    write,
    expandHistory: () => setExpanded(true),
    askReset: () => setAsking(true),
    cancelReset,
    confirmReset,
    save,
  };
}
