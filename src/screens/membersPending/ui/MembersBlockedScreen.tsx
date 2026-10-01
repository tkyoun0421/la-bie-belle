import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { DomainError } from "@/shared/api/errors";
import { queryClient } from "@/shared/api/queryClient";
import { queryKeys } from "@/shared/api/queryKeys";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import type { ToastKind } from "@/shared/ui/Toast";
import { useMembersQuery } from "@/entities/profile/hooks/useMembersQuery";
import { formatElapsedDays } from "@/entities/profile/model/formatElapsedDays";
import { unblockMember } from "@/features/members/api/unblockMember.api";

/**
 * 차단한 사람을 보고 차단을 푸는 자리다. 가입 대기 앱바의 더보기가 여는 화면이고 정본은
 * `docs/2-design/modules/account/screens/membersPending.md`의 「차단한 사람 짜임」이다.
 *
 * **여기는 줄에서 바로 누른다.** 상세 시트가 없다 — 여기서 하는 판단은 「이 사람 맞나」
 * 하나고 그건 사진과 이름이 답한다. 확인 시트에도 사진과 이름을 다시 안 세운다.
 *
 * 푼 사람은 목록에서 빠진다. 승인 여부는 안 건드리고 `submitted_at`만 같이 비므로, 그
 * 사람이 프로필을 다시 보내야 가입 대기에 다시 선다.
 */

const SKELETON_ROWS = [0, 1];

const UNBLOCK_CONFIRM_TEST_ID = "members-pending-unblock-confirm";

type ToastMessage = { kind: ToastKind; message: string };

const ALREADY_DECIDED: ToastMessage = {
  kind: "info",
  message: "이미 처리된 사람이에요",
};

/** 「오늘 차단했어요」·「2일 전에 차단했어요」 — 날 수가 값인 자리에만 조사가 붙는다. */
function blockedLine(blockedAt: string | null, now: string): string {
  if (blockedAt === null) {
    return "";
  }

  const elapsed = formatElapsedDays(blockedAt, now);

  return elapsed.endsWith("전")
    ? `${elapsed}에 차단했어요`
    : `${elapsed} 차단했어요`;
}

export function MembersBlockedScreen() {
  const router = useRouter();

  const { data: rows } = useMembersQuery(supabase, "blocked");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const now = new Date().toISOString();

  const hideToast = useCallback(() => setToast(null), []);

  const closeSheet = useCallback(() => {
    setOpenId(null);
    setFailed(false);
  }, []);

  const open = rows?.find((row) => row.id === openId) ?? null;
  const openName = open?.display_name ?? "";

  const unblock = useCallback(
    async (profileId: string, name: string) => {
      setSending(true);
      setFailed(false);

      try {
        await unblockMember(supabase, profileId);
        closeSheet();
        setToast({ kind: "success", message: `${name} 님의 차단을 풀었어요` });
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

      await queryClient.invalidateQueries({ queryKey: queryKeys.member.all });
    },
    [closeSheet],
  );

  return (
    <Screen>
      <AppBar
        title="차단한 사람"
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace("/admin/members/pending")
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
              차단한 사람이 없어요
            </Text>
          ) : (
            <Card className="py-0">
              {rows.map((row, at) => (
                <ListRow
                  key={row.id}
                  title={row.display_name ?? ""}
                  detail={blockedLine(row.blocked_at, now)}
                  left={
                    <Avatar
                      name={row.display_name ?? ""}
                      photoUrl={row.photo_url}
                    />
                  }
                  right={
                    <Button
                      variant="secondary"
                      size="compact"
                      onPress={() => {
                        setOpenId(row.id);
                        setFailed(false);
                      }}
                    >
                      차단 풀기
                    </Button>
                  }
                  divider={at > 0}
                />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      {open ? (
        <SheetLayer onDismiss={closeSheet}>
          <Text size="base" weight="medium">
            {openName} 님의 차단을 풀까요
          </Text>
          <Text size="sm" tone="muted" className="mt-1">
            다시 로그인할 수 있게 돼요
          </Text>

          {failed ? (
            <Text size="xs" tone="critical" className="mt-3">
              보내지 못했어요. 다시 시도해주세요
            </Text>
          ) : null}

          <View className="mt-6 flex-row gap-3">
            <Button variant="secondary" className="flex-1" onPress={closeSheet}>
              닫기
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              testID={UNBLOCK_CONFIRM_TEST_ID}
              loading={sending}
              onPress={() => void unblock(open.id, openName)}
            >
              차단 풀기
            </Button>
          </View>
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
