import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { ADMIN_HOME_PATH } from "@/shared/consts/navigation.const";
import { NO_VALUE } from "@/shared/consts/noValue.const";
import { spellWon } from "@/shared/utils/spellNumber";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import type { MemberWageRate } from "@/entities/payroll/model/payroll.type";
import {
  buildWageRows,
  wageRatesOf,
} from "@/entities/payroll/model/wageRows.policy";
import { useWageRatesQuery } from "@/entities/payroll/services/useWageRatesQuery";
import {
  countFollowers,
  spellBaseWageNote,
} from "@/features/wageAdmin/utils/followerCount.utils";
import { WAGES_COPY } from "@/screens/wages/consts/wages.const";

export type WagesListState = "loading" | "empty" | "rows";

export type WagesScreenRow = {
  profileId: string;
  displayName: string;
  photoUrl: string | null;
  valueLabel: string;
  press: () => void;
};

export type WagesScreenMember = {
  profileId: string;
  displayName: string;
  photoUrl: string | null;
  rates: MemberWageRate[];
};

export type WagesScreenController = {
  goBack: () => void;
  listState: WagesListState;
  rows: WagesScreenRow[];
  baseValue: string;
  baseNote: string;
  hasDefaultWage: boolean;
  defaultWage: number | null;
  followerCount: number;
  sheet: "default" | "member" | null;
  member: WagesScreenMember | null;
  toast: string | null;
  openBase: () => void;
  finish: (message: string) => void;
  close: () => void;
  dismissToast: () => void;
};

type SheetTarget = { kind: "default" } | { kind: "member"; profileId: string };

export function useWagesScreen(): WagesScreenController {
  const router = useRouter();
  const [target, setTarget] = useState<SheetTarget | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data: members } = useMembersQuery(supabase, "active");
  const { data: wages } = useWageRatesQuery(supabase);

  const close = useCallback(() => setTarget(null), []);

  const finish = useCallback((message: string) => {
    setToast(message);
    setTarget(null);
  }, []);

  const wageRates = wages?.wageRates ?? [];
  const defaultWage = wages?.defaultWageRate?.amount ?? null;
  const hasDefaultWage = defaultWage !== null;

  const rows = buildWageRows(
    (members ?? []).map((member) => ({
      profileId: member.id,
      displayName: member.displayName ?? "",
      photoUrl: member.photoUrl,
    })),
    wageRates,
  );

  const followerCount = countFollowers(
    rows.map((row) => row.profileId),
    wageRates,
  );

  const openRow =
    target?.kind === "member"
      ? (rows.find((row) => row.profileId === target.profileId) ?? null)
      : null;

  const loading = members === undefined || wages === undefined;

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ADMIN_HOME_PATH);
  }, [router]);

  return {
    goBack,
    listState: loading ? "loading" : rows.length === 0 ? "empty" : "rows",
    rows: rows.map((row) => ({
      profileId: row.profileId,
      displayName: row.displayName,
      photoUrl: row.photoUrl ?? null,
      valueLabel: row.amount === null ? NO_VALUE : spellWon(row.amount),
      press: () => setTarget({ kind: "member", profileId: row.profileId }),
    })),
    baseValue: hasDefaultWage ? spellWon(defaultWage) : WAGES_COPY.noBase,
    baseNote: spellBaseWageNote({ hasDefaultWage, followerCount }),
    hasDefaultWage,
    defaultWage,
    followerCount,
    sheet:
      target === null
        ? null
        : target.kind === "default"
          ? "default"
          : openRow === null
            ? null
            : "member",
    member:
      openRow === null
        ? null
        : {
            profileId: openRow.profileId,
            displayName: openRow.displayName,
            photoUrl: openRow.photoUrl ?? null,
            rates: wageRatesOf(wageRates, openRow.profileId),
          },
    toast,
    openBase: () => setTarget({ kind: "default" }),
    finish,
    close,
    dismissToast: () => setToast(null),
  };
}
