import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { ADMIN_HOME_PATH } from "@/shared/consts/navigation.const";
import { useToast, type ToastState } from "@/shared/hooks/useToast";
import { spellWon } from "@/shared/utils/spellNumber";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import type { MemberWageRate } from "@/entities/payroll/model/payroll.type";
import {
  wageRatesOf,
  type WageRowMember,
} from "@/entities/payroll/model/wageRows.policy";
import { useWageRatesQuery } from "@/entities/payroll/services/useWageRatesQuery";
import {
  countFollowers,
  spellBaseWageNote,
} from "@/features/wageAdmin/utils/followerCount.utils";
import { WAGES_COPY } from "@/screens/wages/consts/wages.const";

export type WagesListState = "loading" | "empty" | "rows";

export type WagesScreenMember = {
  profileId: string;
  displayName: string;
  photoUrl: string | null;
  rates: MemberWageRate[];
};

export type WagesScreenController = {
  goBack: () => void;
  listState: WagesListState;
  people: WageRowMember[];
  baseValue: string;
  baseNote: string;
  hasDefaultWage: boolean;
  defaultWage: number | null;
  followerCount: number;
  sheet: "default" | "member" | null;
  member: WagesScreenMember | null;
  toast: ToastState | null;
  openBase: () => void;
  openPerson: (profileId: string) => void;
  finish: (message: string) => void;
  close: () => void;
  dismissToast: () => void;
};

type SheetTarget = { kind: "default" } | { kind: "member"; profileId: string };

export function useWagesScreen(): WagesScreenController {
  const router = useRouter();
  const [target, setTarget] = useState<SheetTarget | null>(null);

  const { data: members } = useMembersQuery(supabase, "active");
  const { data: wages } = useWageRatesQuery(supabase);

  const { toast, showToast, dismissToast } = useToast();

  const close = useCallback(() => setTarget(null), []);

  const finish = useCallback(
    (message: string) => {
      showToast("success", message);
      setTarget(null);
    },
    [showToast],
  );

  const wageRates = wages?.wageRates ?? [];
  const defaultWage = wages?.defaultWageRate?.amount ?? null;
  const hasDefaultWage = defaultWage !== null;

  const people = (members ?? []).map((member) => ({
    profileId: member.id,
    displayName: member.displayName ?? "",
    photoUrl: member.photoUrl,
  }));

  const followerCount = countFollowers(
    people.map((person) => person.profileId),
    wageRates,
  );

  const chosen =
    target?.kind === "member"
      ? (people.find((person) => person.profileId === target.profileId) ?? null)
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
    listState: loading ? "loading" : people.length === 0 ? "empty" : "rows",
    people,
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
          : chosen === null
            ? null
            : "member",
    member:
      chosen === null
        ? null
        : {
            profileId: chosen.profileId,
            displayName: chosen.displayName,
            photoUrl: chosen.photoUrl ?? null,
            rates: wageRatesOf(wageRates, chosen.profileId),
          },
    toast,
    openBase: () => setTarget({ kind: "default" }),
    openPerson: (profileId) => setTarget({ kind: "member", profileId }),
    finish,
    close,
    dismissToast,
  };
}
