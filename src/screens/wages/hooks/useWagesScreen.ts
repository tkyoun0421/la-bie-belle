import { useCallback, useEffect, useState } from "react";
import type { DB } from "@/shared/api/database";
import { NO_VALUE } from "@/shared/consts/noValue.const";
import { kstToday } from "@/shared/lib/kstToday.lib";
import { spellWon } from "@/shared/utils/spellNumber";
import { useMembersQuery } from "@/entities/member/services/useMembersQuery";
import { useWageRatesQuery } from "@/entities/payroll/services/useWageRatesQuery";
import { useResetWageToDefaultMutation } from "@/features/wageAdmin/services/useResetWageToDefaultMutation";
import { useSetDefaultWageMutation } from "@/features/wageAdmin/services/useSetDefaultWageMutation";
import { useSetWageMutation } from "@/features/wageAdmin/services/useSetWageMutation";
import { WAGE_CAP_HINT, WAGES_COPY } from "@/screens/wages/consts/wages.const";
import { canResetToDefault } from "@/screens/wages/model/canResetToDefault.policy";
import {
  atWageCap,
  canSaveWage,
  formatAmountDisplay,
  nextAmountDigits,
} from "@/screens/wages/model/wageAmount.policy";
import { isNoDefaultWage } from "@/screens/wages/model/wageError.policy";
import {
  buildWageRows,
  wageRatesOf,
} from "@/screens/wages/model/wageRows.policy";
import {
  countFollowers,
  spellBaseWageNote,
  spellFollowerChangeLine,
} from "@/screens/wages/utils/followerCount.utils";
import {
  buildWageHistory,
  prefillWageAmount,
  spellWageDate,
} from "@/screens/wages/utils/wageHistory.utils";

/**
 * 관리자가 기본 시급과 사람별 시급을 정하는 화면의 controller다. 정본은
 * `docs/2-design/modules/payroll/screens/wages.md`고 완료 조건은
 * `docs/2-design/spec/payroll-wages.md`다.
 *
 * **금액 칸 하나를 시트 둘이 같이 쓴다.** 한 번에 한 시트만 열려서 자릿수 상태가 하나면
 * 되고, 「저장이 눌리나」는 지금 열린 시트의 현재 값에 달려 있다 — 그 가름을 여기서 한 번만
 * 한다.
 *
 * **보낸 것이 성공하면 시트가 닫히고 토스트가 선다.** 셋 다 그 꼴이고 말만 다르다 — 그래서
 * 열림이 통신에 매여 있고 화면 것이 아니다.
 *
 * **이력은 받은 데이터에서 갈려 나온다.** 시트를 열 때 질의를 새로 안 던져 로딩이 없다
 * (plan payroll-wages AC-05).
 *
 * **금액 칸의 꼴 바꾸기도 여기서 끝낸다.** `.tsx`가 받는 것은 그릴 글자와 「눌리나」 하나다 —
 * 자릿수에서 쉼표를 넣는 일과 상한에 닿았는지 보는 일은 `model`의 손이 하고 controller가
 * 그것을 부른다.
 */

export type WagesListState = "loading" | "empty" | "rows";

export type WagesScreenRow = {
  profileId: string;
  displayName: string;
  photoUrl: string | null;
  valueLabel: string;
  press: () => void;
};

export type WagesScreenMember = {
  displayName: string;
  photoUrl: string | null;
};

/** 이력 한 줄이다 — 날짜 꼴과 금액 꼴이 여기서 이미 글자가 된다. */
export type WagesHistoryRow = {
  key: string;
  dateLabel: string;
  amountLabel: string;
};

export type WagesScreenController = {
  listState: WagesListState;
  rows: WagesScreenRow[];
  baseValue: string;
  baseNote: string;
  hasDefaultWage: boolean;
  defaultWage: number | null;
  followerCount: number;
  sheet: "default" | "member" | null;
  member: WagesScreenMember | null;
  historyRows: WagesHistoryRow[];
  historyHasMore: boolean;
  amountText: string;
  capHint: string | undefined;
  canSave: boolean;
  sending: boolean;
  failed: boolean;
  canReset: boolean;
  asking: boolean;
  resetBody: string | undefined;
  resetNotice: string | undefined;
  followerLine: string;
  toast: string | null;
  openBase: () => void;
  write: (typed: string) => void;
  expandHistory: () => void;
  save: () => void;
  askReset: () => void;
  cancelReset: () => void;
  confirmReset: () => void;
  close: () => void;
  dismissToast: () => void;
};

type SheetTarget = { kind: "default" } | { kind: "member"; profileId: string };

function digitsOf(amount: number | null): string {
  return amount === null ? "" : String(amount);
}

export function useWagesScreen(client: DB): WagesScreenController {
  const [target, setTarget] = useState<SheetTarget | null>(null);
  const [digits, setDigits] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [asking, setAsking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { data: members } = useMembersQuery(client, "active");
  const { data: wages } = useWageRatesQuery(client);

  const {
    mutate: saveWage,
    isPending: savingWage,
    isSuccess: wageSaved,
    error: wageError,
    reset: resetWageSave,
  } = useSetWageMutation(client);

  const {
    mutate: saveDefaultWage,
    isPending: savingDefaultWage,
    isSuccess: defaultWageSaved,
    error: defaultWageError,
    reset: resetDefaultWageSave,
  } = useSetDefaultWageMutation(client);

  const {
    mutate: sendReset,
    isSuccess: resetDone,
    error: resetError,
    reset: resetResetSend,
  } = useResetWageToDefaultMutation(client);

  const close = useCallback(() => {
    setTarget(null);
    setDigits("");
    setExpanded(false);
    setAsking(false);
    resetWageSave();
    resetDefaultWageSave();
    resetResetSend();
  }, [resetWageSave, resetDefaultWageSave, resetResetSend]);

  const finish = useCallback(
    (message: string) => {
      setToast(message);
      close();
    },
    [close],
  );

  useEffect(() => {
    if (wageSaved) {
      finish(WAGES_COPY.wageChanged);
    }
  }, [wageSaved, finish]);

  useEffect(() => {
    if (defaultWageSaved) {
      finish(WAGES_COPY.defaultChanged);
    }
  }, [defaultWageSaved, finish]);

  useEffect(() => {
    if (resetDone) {
      finish(WAGES_COPY.resetDone);
    }
  }, [resetDone, finish]);

  const wageRates = wages?.wageRates ?? [];
  const defaultWage = wages?.defaultWageRate?.amount ?? null;
  const hasDefaultWage = defaultWage !== null;

  const rows = buildWageRows(
    (members ?? []).map((member) => ({
      profileId: member.id,
      displayName: member.display_name ?? "",
      photoUrl: member.photo_url,
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

  const memberRates =
    openRow === null ? [] : wageRatesOf(wageRates, openRow.profileId);

  const memberWage = prefillWageAmount(memberRates, kstToday());

  const currentAmount =
    target?.kind === "default"
      ? defaultWage
      : openRow === null
        ? null
        : memberWage;

  const history = buildWageHistory(memberRates, expanded);

  const loading = members === undefined || wages === undefined;

  return {
    listState: loading ? "loading" : rows.length === 0 ? "empty" : "rows",
    rows: rows.map((row) => ({
      profileId: row.profileId,
      displayName: row.displayName,
      photoUrl: row.photoUrl ?? null,
      valueLabel: row.amount === null ? NO_VALUE : spellWon(row.amount),
      press: () => {
        setTarget({ kind: "member", profileId: row.profileId });
        setDigits(
          digitsOf(
            prefillWageAmount(
              wageRatesOf(wageRates, row.profileId),
              kstToday(),
            ),
          ),
        );
        setExpanded(false);
        setAsking(false);
      },
    })),
    baseValue: hasDefaultWage ? spellWon(defaultWage) : WAGES_COPY.noBase,
    baseNote: spellBaseWageNote({ hasDefaultWage, followerCount }),
    hasDefaultWage,
    defaultWage,
    followerCount,
    sheet:
      target === null ? null : target.kind === "default" ? "default" : "member",
    member:
      openRow === null
        ? null
        : {
            displayName: openRow.displayName,
            photoUrl: openRow.photoUrl ?? null,
          },
    historyRows: history.rows.map((row) => ({
      key: row.effective_date,
      dateLabel: spellWageDate(row.effective_date),
      amountLabel: spellWon(row.amount),
    })),
    historyHasMore: history.hasMore,
    amountText: formatAmountDisplay(digits),
    capHint: atWageCap(digits) ? WAGE_CAP_HINT : undefined,
    canSave: canSaveWage(digits, currentAmount),
    sending: target?.kind === "default" ? savingDefaultWage : savingWage,
    failed:
      target?.kind === "default"
        ? defaultWageError !== null
        : wageError !== null,
    canReset: canResetToDefault(memberRates, hasDefaultWage),
    asking,
    resetBody:
      defaultWage === null
        ? undefined
        : `${WAGES_COPY.resetBodyPrefix}${spellWon(defaultWage)}${WAGES_COPY.resetBodySuffix}`,
    resetNotice: isNoDefaultWage(resetError)
      ? WAGES_COPY.noDefaultWageNotice
      : undefined,
    followerLine: spellFollowerChangeLine(followerCount),
    toast,
    openBase: () => {
      setTarget({ kind: "default" });
      setDigits(digitsOf(defaultWage));
      setExpanded(false);
      setAsking(false);
    },
    write: (typed) => setDigits(nextAmountDigits(digits, typed)),
    expandHistory: () => setExpanded(true),
    save: () => {
      if (target === null || !canSaveWage(digits, currentAmount)) {
        return;
      }

      if (target.kind === "default") {
        saveDefaultWage(Number(digits));
        return;
      }

      saveWage({ profileId: target.profileId, amount: Number(digits) });
    },
    askReset: () => setAsking(true),
    cancelReset: () => {
      setAsking(false);
      resetResetSend();
    },
    confirmReset: () => {
      if (openRow !== null) {
        sendReset(openRow.profileId);
      }
    },
    close,
    dismissToast: () => setToast(null),
  };
}
