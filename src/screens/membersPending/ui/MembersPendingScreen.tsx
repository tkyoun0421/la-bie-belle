import { useRouter } from "expo-router";
import { EllipsisVertical } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { DomainError } from "@/shared/api/errors";
import { queryClient } from "@/shared/lib/queryClient";
import { supabase } from "@/shared/lib/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Card } from "@/shared/ui/Card";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { ListRow } from "@/shared/ui/ListRow";
import { MorePopover, MorePopoverItem } from "@/shared/ui/MorePopover";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import type { ToastKind } from "@/shared/ui/Toast";
import { approveMember } from "@/entities/profile/dals/approveMember";
import { blockMember } from "@/entities/profile/dals/blockMember";
import type { MemberListRow } from "@/entities/profile/dals/listMembers";
import {
  getProfilePrivate,
  type ProfilePrivateRow,
} from "@/entities/profile/dals/profilePrivate";
import { rejectMember } from "@/entities/profile/dals/rejectMember";
import { formatElapsedDays } from "@/entities/profile/model/formatElapsedDays";
import { MEMBERS_KEY } from "@/features/members/model/queryKeys";
import { useMembers } from "@/features/members/model/useMembers";
import {
  MemberDetailSheet,
  type MemberDecision,
  type SheetFace,
} from "@/screens/membersPending/ui/MemberDetailSheet";

/**
 * 관리자가 가입 신청을 받거나 돌려보내는 화면이다. 앱 전체의 첫 문이다 — 승인이 없으면
 * 근무표도 급여도 안 열린다. 정본은
 * `docs/2-design/modules/account/screens/membersPending.md`고 완료 조건은
 * `docs/2-design/spec/members-pending.md`다.
 *
 * **줄에서 바로 판정하지 않는다.** 누르면 시트가 올라오고 거기서 정한다. 줄에서 승인하면
 * 성별과 생년월일과 연락처를 못 보고 누르게 되는데 그 셋이 관리자가 사람을 알아보는
 * 재료다.
 *
 * **늦게 누른 쪽은 `already_decided`를 받는다.** 그때는 시트를 닫고 안내 토스트를 띄운 뒤
 * 목록을 다시 읽는다 — 이미 처리된 사람의 줄이 남아 있을 이유가 없다. 통신이 끊긴
 * 것이면 시트를 연 채로 둔다. 사람이 다시 누를 자리가 거기다.
 */

const SKELETON_ROWS = [0, 1, 2];

const MORE_ICON_SIZE = 20;

const MORE_HIT_SLOP = 8;

type ToastMessage = { kind: ToastKind; message: string };

const ALREADY_DECIDED: ToastMessage = {
  kind: "info",
  message: "이미 처리된 사람이에요",
};

/** 「오늘 보냈어요」·「3일 전에 보냈어요」 — 날 수가 값인 자리에만 조사가 붙는다. */
function sentLine(submittedAt: string | null, now: string): string {
  if (submittedAt === null) {
    return "";
  }

  const elapsed = formatElapsedDays(submittedAt, now);

  return elapsed.endsWith("전")
    ? `${elapsed}에 보냈어요`
    : `${elapsed} 보냈어요`;
}

export function MembersPendingScreen() {
  const router = useRouter();

  const { data: rows } = useMembers(supabase, "pending");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [face, setFace] = useState<SheetFace>("detail");
  const [values, setValues] = useState<ProfilePrivateRow | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const now = new Date().toISOString();

  const hideToast = useCallback(() => setToast(null), []);

  const closeSheet = useCallback(() => {
    setOpenId(null);
    setFace("detail");
    setValues(null);
    setFailed(false);
  }, []);

  const openSheet = useCallback((row: MemberListRow) => {
    setMenuOpen(false);
    setOpenId(row.id);
    setFace("detail");
    setValues(null);
    setFailed(false);

    void getProfilePrivate(supabase, row.id)
      .then(setValues)
      .catch(() => setValues(null));
  }, []);

  const decide = useCallback(
    async (
      profileId: string,
      send: (profileId: string) => Promise<void>,
      done: string,
    ) => {
      setSending(true);
      setFailed(false);

      try {
        await send(profileId);
        closeSheet();
        setToast({ kind: "success", message: done });
      } catch (error) {
        if (error instanceof DomainError && error.code === "already_decided") {
          closeSheet();
          setToast(ALREADY_DECIDED);
        } else {
          setFailed(true);
          return;
        }
      } finally {
        setSending(false);
      }

      await queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
    [closeSheet],
  );

  const open = rows?.find((row) => row.id === openId) ?? null;
  const openName = open?.display_name ?? "";

  const confirm = (decision: MemberDecision) => {
    if (!open) {
      return;
    }

    if (decision === "reject") {
      void decide(
        open.id,
        (id) => rejectMember(supabase, id),
        `${openName} 님을 안 받았어요`,
      );
      return;
    }

    void decide(
      open.id,
      (id) => blockMember(supabase, id),
      `${openName} 님을 차단했어요`,
    );
  };

  return (
    <Screen>
      <AppBar
        title="가입 대기"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/admin")
        }
        right={
          <View className="relative">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="더보기"
              hitSlop={MORE_HIT_SLOP}
              onPress={() => setMenuOpen((opened) => !opened)}
            >
              <Icon icon={EllipsisVertical} size={MORE_ICON_SIZE} />
            </Pressable>
            <MorePopover open={menuOpen}>
              <MorePopoverItem
                label="차단한 사람"
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/admin/members/blocked");
                }}
              />
            </MorePopover>
          </View>
        }
      />

      <ScrollView>
        <View className="px-5 pb-5">
          {rows === undefined ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : rows.length === 0 ? (
            <Text size="sm" tone="subtle" className="py-4">
              기다리는 사람이 없어요
            </Text>
          ) : (
            <Card className="py-0">
              {rows.map((row, at) => (
                <ListRow
                  key={row.id}
                  title={row.display_name ?? ""}
                  detail={sentLine(row.submitted_at, now)}
                  left={
                    <Avatar
                      name={row.display_name ?? ""}
                      photoUrl={row.photo_url}
                    />
                  }
                  chevron
                  divider={at > 0}
                  onPress={() => openSheet(row)}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      {open ? (
        <SheetLayer onDismiss={closeSheet}>
          <MemberDetailSheet
            name={openName}
            photoUrl={open.photo_url}
            submittedAt={open.submitted_at}
            values={values}
            today={now}
            face={face}
            sending={sending}
            failed={failed}
            onFace={setFace}
            onApprove={() =>
              void decide(
                open.id,
                (id) => approveMember(supabase, id),
                `${openName} 님을 승인했어요`,
              )
            }
            onConfirm={confirm}
          />
        </SheetLayer>
      ) : null}

      {toast ? (
        <FloatingToast
          kind={toast.kind}
          message={toast.message}
          onDone={hideToast}
        />
      ) : null}
    </Screen>
  );
}
