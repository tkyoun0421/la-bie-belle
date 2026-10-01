import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { DomainError } from "@/shared/api/errors";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Divider } from "@/shared/ui/Divider";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import { kstToday } from "@/shared/utils/kstDate";
import { spellWon } from "@/shared/utils/spellNumber";
import { useMembersQuery } from "@/entities/member/hooks/useMembersQuery";
import { useWageRatesQuery } from "@/entities/payroll/hooks/useWageRatesQuery";
import { useResetWageToDefaultMutation } from "@/features/wageAdmin/hooks/useResetWageToDefaultMutation";
import { useSetDefaultWageMutation } from "@/features/wageAdmin/hooks/useSetDefaultWageMutation";
import { useSetWageMutation } from "@/features/wageAdmin/hooks/useSetWageMutation";
import { countFollowers } from "@/screens/wages/model/followerCount";
import { prefillWageAmount } from "@/screens/wages/model/wageHistory";
import { buildWageRows, wageRatesOf } from "@/screens/wages/model/wageRows";
import { DefaultWageSheet } from "@/screens/wages/ui/DefaultWageSheet";
import { MemberWageSheet } from "@/screens/wages/ui/MemberWageSheet";
import { ResetWageDialog } from "@/screens/wages/ui/ResetWageDialog";

/**
 * 관리자가 기본 시급과 사람별 시급을 정하는 화면이다. 정본은
 * `docs/2-design/modules/payroll/screens/wages.md`고 완료 조건은
 * `docs/2-design/spec/payroll-wages.md`다.
 *
 * **정해야 할 것이 둘이라 줄도 둘이다.** 기본 시급 줄이 목록에 안 섞이고 맨 위에 따로 선다 —
 * 한 줄이 여러 사람의 값을 한꺼번에 움직이는 자리라 같은 모양으로 늘어놓으면 무게가 안 보인다.
 *
 * **기본을 쓰는 사람을 줄에 표시 안 한다.** 누가 기본을 따라 움직이는지는 맨 위 줄이 수로
 * 말하고, 목록이 답하는 것은 누가 얼마를 받는지다.
 *
 * **질의가 둘이고 시트는 그중에서 갈라 쓴다.** 이름과 사진은 `['members']`가, 시급은
 * `['payroll', 'wages']`가 낸다. 사람 시트의 이력도 목록이 이미 받은 데이터라 시트를 열 때
 * 로딩이 없다.
 *
 * **날짜를 다루는 조각이 하나도 없다.** 적용은 언제나 오늘부터고 미리 넣어두는 길도
 * 소급하는 길도 없다(PAY-008·PAY-009).
 */

const SKELETON_ROWS = [0, 1, 2];

const NO_WAGE = "—";

const NO_FOLLOWER = "아직 이 값을 쓰는 사람이 없어요";

const NO_DEFAULT_WAGE_NOTICE = "기본 시급을 아직 안 정했어요";

type SheetTarget = { kind: "default" } | { kind: "member"; profileId: string };

function digitsOf(amount: number | null): string {
  return amount === null ? "" : String(amount);
}

function codeOf(error: Error | null): string | null {
  return error instanceof DomainError ? error.code : null;
}

export function WagesScreen() {
  const router = useRouter();

  const [sheet, setSheet] = useState<SheetTarget | null>(null);
  const [digits, setDigits] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [asking, setAsking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { data: members } = useMembersQuery(supabase, "active");
  const { data: wages } = useWageRatesQuery(supabase);

  const {
    mutate: saveWage,
    isPending: savingWage,
    isSuccess: wageSaved,
    error: wageError,
    reset: resetWageSave,
  } = useSetWageMutation(supabase);

  const {
    mutate: saveDefaultWage,
    isPending: savingDefaultWage,
    isSuccess: defaultWageSaved,
    error: defaultWageError,
    reset: resetDefaultWageSave,
  } = useSetDefaultWageMutation(supabase);

  const {
    mutate: sendReset,
    isSuccess: resetDone,
    error: resetError,
    reset: resetResetSend,
  } = useResetWageToDefaultMutation(supabase);

  const close = useCallback(() => {
    setSheet(null);
    setDigits("");
    setExpanded(false);
    setAsking(false);
    resetWageSave();
    resetDefaultWageSave();
    resetResetSend();
  }, [resetWageSave, resetDefaultWageSave, resetResetSend]);

  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!wageSaved) {
      return;
    }

    setToast("시급을 바꿨어요");
    close();
  }, [wageSaved, close]);

  useEffect(() => {
    if (!defaultWageSaved) {
      return;
    }

    setToast("기본 시급을 바꿨어요");
    close();
  }, [defaultWageSaved, close]);

  useEffect(() => {
    if (!resetDone) {
      return;
    }

    setToast("기본 시급으로 되돌렸어요");
    close();
  }, [resetDone, close]);

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

  const openMember =
    sheet?.kind === "member"
      ? (rows.find((row) => row.profileId === sheet.profileId) ?? null)
      : null;

  const memberRates =
    openMember === null ? [] : wageRatesOf(wageRates, openMember.profileId);

  const memberWage = prefillWageAmount(memberRates, kstToday());

  const openDefaultSheet = () => {
    setSheet({ kind: "default" });
    setDigits(digitsOf(defaultWage));
    setExpanded(false);
    setAsking(false);
  };

  const openMemberSheet = (profileId: string) => {
    setSheet({ kind: "member", profileId });
    setDigits(
      digitsOf(
        prefillWageAmount(wageRatesOf(wageRates, profileId), kstToday()),
      ),
    );
    setExpanded(false);
    setAsking(false);
  };

  const loading = members === undefined || wages === undefined;

  const baseValue = hasDefaultWage ? spellWon(defaultWage) : "아직 안 정했어요";

  const baseNote = hasDefaultWage
    ? followerCount === 0
      ? NO_FOLLOWER
      : `${followerCount}명이 이 값을 써요`
    : followerCount === 0
      ? "정하면 새로 승인되는 사람부터 붙어요"
      : `정하면 ${followerCount}명에게 함께 붙어요`;

  return (
    <Screen floor="plain">
      <AppBar
        title="시급"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/admin")
        }
      />

      <ScrollView>
        <View className="px-5 pb-5">
          <View>
            <ListRow
              title="기본 시급"
              value={baseValue}
              chevron
              onPress={openDefaultSheet}
            />
            <Text size="xs" tone="subtle" numeric className="mt-1">
              {baseNote}
            </Text>
          </View>

          <Divider className="my-2" />

          {loading ? (
            SKELETON_ROWS.map((at) => (
              <SkeletonLine key={at} className="my-4 w-2/3" />
            ))
          ) : rows.length === 0 ? (
            <EmptyState
              scene="no-members"
              title="아직 승인된 사람이 없어요"
              description="가입을 승인하면 여기 서요"
            />
          ) : (
            rows.map((row, at) => (
              <ListRow
                key={row.profileId}
                title={row.displayName}
                value={row.amount === null ? NO_WAGE : spellWon(row.amount)}
                left={<Avatar name={row.displayName} photoUrl={row.photoUrl} />}
                chevron
                divider={at > 0}
                onPress={() => openMemberSheet(row.profileId)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {sheet?.kind === "default" ? (
        <SheetLayer onDismiss={close}>
          <DefaultWageSheet
            currentAmount={defaultWage}
            followerCount={followerCount}
            digits={digits}
            sending={savingDefaultWage}
            failed={defaultWageError !== null}
            onDigits={setDigits}
            onClose={close}
            onSave={() => saveDefaultWage(Number(digits))}
          />
        </SheetLayer>
      ) : null}

      {openMember ? (
        <SheetLayer onDismiss={close}>
          <MemberWageSheet
            name={openMember.displayName}
            photoUrl={openMember.photoUrl ?? null}
            rates={memberRates}
            currentAmount={memberWage}
            hasDefaultWage={hasDefaultWage}
            digits={digits}
            expanded={expanded}
            sending={savingWage}
            failed={wageError !== null}
            onDigits={setDigits}
            onExpand={() => setExpanded(true)}
            onReset={() => setAsking(true)}
            onClose={close}
            onSave={() =>
              saveWage({
                profileId: openMember.profileId,
                amount: Number(digits),
              })
            }
          />
        </SheetLayer>
      ) : null}

      <ResetWageDialog
        visible={asking}
        defaultAmount={defaultWage}
        notice={
          codeOf(resetError) === "no_default_wage"
            ? NO_DEFAULT_WAGE_NOTICE
            : undefined
        }
        onClose={() => {
          setAsking(false);
          resetResetSend();
        }}
        onConfirm={() =>
          openMember === null ? undefined : sendReset(openMember.profileId)
        }
      />

      {toast ? <FloatingToast message={toast} onDone={hideToast} /> : null}
    </Screen>
  );
}
