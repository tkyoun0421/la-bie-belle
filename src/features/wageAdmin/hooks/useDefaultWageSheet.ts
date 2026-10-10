import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  WAGE_CAP_HINT,
  WAGE_SAVE_FAILED_TITLE,
  WAGE_SHEET_COPY,
} from "@/features/wageAdmin/consts/wageAdmin.const";
import {
  atWageCap,
  canSaveWage,
  formatAmountDisplay,
  nextAmountDigits,
} from "@/features/wageAdmin/model/wageAmount.policy";
import { useSetDefaultWageMutation } from "@/features/wageAdmin/services/useSetDefaultWageMutation";
import { spellFollowerChangeLine } from "@/features/wageAdmin/utils/followerCount.utils";

export type DefaultWageSheetInput = {
  defaultWage: number | null;
  followerCount: number;
  onDone: (message: string) => void;
};

export type DefaultWageSheetController = {
  followerLine: string;
  amountText: string;
  capHint: string | undefined;
  canSave: boolean;
  sending: boolean;
  failedLine: string | null;
  write: (typed: string) => void;
  save: () => void;
};

export function useDefaultWageSheet({
  defaultWage,
  followerCount,
  onDone,
}: DefaultWageSheetInput): DefaultWageSheetController {
  const [digits, setDigits] = useState(
    defaultWage === null ? "" : String(defaultWage),
  );

  const {
    mutate: saveDefaultWage,
    isPending,
    isSuccess,
    error,
  } = useSetDefaultWageMutation(supabase);

  useEffect(() => {
    if (isSuccess) {
      onDone(WAGE_SHEET_COPY.defaultChanged);
    }
  }, [isSuccess, onDone]);

  const write = useCallback(
    (typed: string) => setDigits((kept) => nextAmountDigits(kept, typed)),
    [],
  );

  const save = useCallback(() => {
    if (canSaveWage(digits, defaultWage)) {
      saveDefaultWage(Number(digits));
    }
  }, [digits, defaultWage, saveDefaultWage]);

  return {
    followerLine: spellFollowerChangeLine(followerCount),
    amountText: formatAmountDisplay(digits),
    capHint: atWageCap(digits) ? WAGE_CAP_HINT : undefined,
    canSave: canSaveWage(digits, defaultWage),
    sending: isPending,
    failedLine: error === null ? null : WAGE_SAVE_FAILED_TITLE,
    write,
    save,
  };
}
