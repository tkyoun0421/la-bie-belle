import { supabase } from "@/shared/api/supabase";
import { NO_VALUE } from "@/shared/consts/noValue.const";
import { spellWon } from "@/shared/utils/spellNumber";
import {
  buildWageRows,
  type WageRowMember,
} from "@/entities/payroll/model/wageRows.policy";
import { useWageRatesQuery } from "@/entities/payroll/services/useWageRatesQuery";

export type WageRowsState = "pending" | "failed" | "rows";

export type WageRowLine = {
  profileId: string;
  displayName: string;
  photoUrl: string | null;
  valueLabel: string;
  press: () => void;
};

export type WageRowsController = {
  state: WageRowsState;
  rows: WageRowLine[];
};

export type WageRowsSource = {
  people: readonly WageRowMember[];
  onPressPerson: (profileId: string) => void;
};

export function useWageRows({
  people,
  onPressPerson,
}: WageRowsSource): WageRowsController {
  const { data, error } = useWageRatesQuery(supabase);

  if (error !== null) {
    return { state: "failed", rows: [] };
  }

  if (data === undefined) {
    return { state: "pending", rows: [] };
  }

  return {
    state: "rows",
    rows: buildWageRows(people, data.wageRates).map((row) => ({
      profileId: row.profileId,
      displayName: row.displayName,
      photoUrl: row.photoUrl ?? null,
      valueLabel: row.amount === null ? NO_VALUE : spellWon(row.amount),
      press: () => onPressPerson(row.profileId),
    })),
  };
}
