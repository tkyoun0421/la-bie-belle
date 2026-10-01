import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { DomainError } from "@/shared/api/errors";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Input } from "@/shared/ui/Input";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Text } from "@/shared/ui/Text";
import type { ToastKind } from "@/shared/ui/Toast";
import type { MemberRow } from "@/entities/profile/api/listMembers.api";
import { useMembersQuery } from "@/entities/profile/hooks/useMembersQuery";
import { isLastAdmin } from "@/entities/profile/model/isLastAdmin";
import { searchMembers } from "@/entities/profile/model/searchMembers";
import { isLeftOverAYear } from "@/entities/profile/model/sortMembers";
import { useMarkLeaveMutation } from "@/features/members/hooks/useMarkLeaveMutation";
import { useSetDisplayNameMutation } from "@/features/members/hooks/useSetDisplayNameMutation";
import { useSetRoleMutation } from "@/features/members/hooks/useSetRoleMutation";
import { useUndoLeaveMutation } from "@/features/members/hooks/useUndoLeaveMutation";
import {
  getMemberListSuffix,
  getMemberSheetLine,
} from "@/features/notification/model/reachMessage";
import {
  PERMISSION_OF_OTHERS,
  getReachState,
} from "@/features/notification/model/reachState";
import {
  MemberDialog,
  type MemberDialogKind,
} from "@/screens/members/ui/MemberDialog";
import {
  MemberSheet,
  spellLeftAt,
  type MemberSheetFace,
} from "@/screens/members/ui/MemberSheet";

/**
 * 관리자가 이미 받은 사람들을 다루는 화면이다. 여기서 하는 일이 셋이다 — 이름 고치기,
 * 관리자로 올리고 내리기, 퇴사 처리. 정본은
 * `docs/2-design/modules/account/screens/members.md`고 완료 조건은
 * `docs/2-design/spec/members.md`다.
 *
 * **퇴사한 사람이 같은 화면 아래에 있다.** 별도 화면으로 안 뺀다 — 실수로 퇴사 처리한 것을
 * 되돌리거나 지난 이름을 확인하는 일이 드물지만 있고, 화면을 하나 더 만들 만큼은 아니다.
 * 검색도 두 구획을 같이 거른다.
 *
 * **막는 자리 둘은 서버가 정한다.** 화면이 마지막 관리자의 내리기 버튼을 미리 잠그지만 그것은
 * 목록을 받은 시점의 판정이고, 누르는 시점의 판정은 `last_admin`과
 * `has_future_assignments`로 돌아와 Dialog가 이유를 말한다.
 *
 * **아직 안 그린 셋.** 시급 줄은 시급 표가 서기 전이라 붙일 값이 없고(members.md의 「사람 시트
 * 짜임」), 알림 미수신 한 마디는 notification 쪽 task가 잇고, 「근무표로 가기」의 목적지 화면은
 * 아직 없다.
 */

const SKELETON_ROWS = [0, 1, 2];

const HANDLED_CODES = new Set([
  "has_future_assignments",
  "last_admin",
  "already_decided",
]);

type ToastMessage = { kind: ToastKind; message: string };

const ALREADY_DECIDED: ToastMessage = {
  kind: "info",
  message: "이미 처리된 사람이에요",
};

function codeOf(error: Error | null): string | null {
  return error instanceof DomainError ? error.code : null;
}

function unexpected(error: Error | null): boolean {
  return error !== null && !HANDLED_CODES.has(codeOf(error) ?? "");
}

/** 연락처 바로 뒤라 다음 손짓이 이어진다 — 알림이 안 가는 사람에게 할 일이 전화다. */
function detailOf(phone: string | null, suffix: string | null): string {
  return [phone ?? "", suffix ?? ""].filter((part) => part !== "").join(" ");
}

export function MembersScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [face, setFace] = useState<MemberSheetFace>("detail");
  const [draft, setDraft] = useState("");
  const [asked, setAsked] = useState<MemberDialogKind | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const { data: active } = useMembersQuery(supabase, "active");
  const { data: left } = useMembersQuery(supabase, "left");

  const {
    mutate: saveName,
    isPending: savingName,
    isSuccess: nameSaved,
    error: nameError,
    reset: resetName,
  } = useSetDisplayNameMutation(supabase);

  const {
    mutate: saveRole,
    isSuccess: roleSaved,
    error: roleError,
    reset: resetRole,
  } = useSetRoleMutation(supabase);

  const {
    mutate: sendLeave,
    isSuccess: leaveDone,
    error: leaveError,
    reset: resetLeave,
  } = useMarkLeaveMutation(supabase);

  const {
    mutate: sendUndo,
    isSuccess: undoDone,
    error: undoError,
    reset: resetUndo,
  } = useUndoLeaveMutation(supabase);

  const now = new Date().toISOString();

  const close = useCallback(() => {
    setOpenId(null);
    setFace("detail");
    setDraft("");
    setAsked(null);
    resetName();
    resetRole();
    resetLeave();
    resetUndo();
  }, [resetName, resetRole, resetLeave, resetUndo]);

  const hideToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!nameSaved) {
      return;
    }

    setToast({ kind: "success", message: "이름을 바꿨어요" });
    close();
  }, [nameSaved, close]);

  useEffect(() => {
    if (!roleSaved) {
      return;
    }

    setToast({
      kind: "success",
      message: asked === "demote" ? "관리자에서 내렸어요" : "관리자로 올렸어요",
    });
    close();
  }, [roleSaved, asked, close]);

  useEffect(() => {
    if (!leaveDone) {
      return;
    }

    setToast({ kind: "success", message: "퇴사 처리했어요" });
    close();
  }, [leaveDone, close]);

  useEffect(() => {
    if (!undoDone) {
      return;
    }

    setToast({ kind: "success", message: "퇴사를 되돌렸어요" });
    close();
  }, [undoDone, close]);

  const leaveCode = codeOf(leaveError);
  const undoCode = codeOf(undoError);

  useEffect(() => {
    if (leaveCode !== "already_decided" && undoCode !== "already_decided") {
      return;
    }

    setToast(ALREADY_DECIDED);
    close();
  }, [leaveCode, undoCode, close]);

  const rows = [...(active ?? []), ...(left ?? [])];
  const open = rows.find((row) => row.id === openId) ?? null;

  /**
   * 갈래는 재직자에게만 붙는다 — 퇴사 구획은 이 표에 아예 안 든다. 남의 기기 권한은 알
   * 길이 없어 판정 축이 의사와 기기 둘뿐이다(`reachState.ts`).
   */
  const reach = useMemo(() => {
    const suffixes = new Map<string, string | null>();
    const lines = new Map<string, string | null>();

    for (const row of active ?? []) {
      const state = getReachState({
        notificationsEnabled: row.notifications_enabled,
        hasDevice: row.has_device,
        permission: PERMISSION_OF_OTHERS,
      });

      suffixes.set(row.id, getMemberListSuffix(state, true));
      lines.set(row.id, getMemberSheetLine(state, true));
    }

    return { suffixes, lines };
  }, [active]);

  const refused =
    leaveCode === "has_future_assignments"
      ? "blocked"
      : leaveCode === "last_admin" || codeOf(roleError) === "last_admin"
        ? "last-admin"
        : null;

  const dialog: MemberDialogKind | null = refused ?? asked;

  const closeDialog = useCallback(() => {
    setAsked(null);
    resetRole();
    resetLeave();
  }, [resetRole, resetLeave]);

  const confirm = () => {
    if (!open) {
      return;
    }

    if (asked === "promote" || asked === "demote") {
      saveRole({
        profileId: open.id,
        role: asked === "promote" ? "admin" : "member",
      });
      return;
    }

    if (asked === "leave") {
      sendLeave({ profileId: open.id });
      return;
    }

    if (asked === "undo") {
      sendUndo({ profileId: open.id });
    }
  };

  const openSheet = (row: MemberRow) => {
    setOpenId(row.id);
    setFace("detail");
    setDraft(row.display_name ?? "");
    setAsked(null);
  };

  const showFace = (next: MemberSheetFace) => {
    if (next === "rename") {
      setDraft(open?.display_name ?? "");
    }
    setFace(next);
  };

  const loading = active === undefined || left === undefined;
  const empty = !loading && active.length === 0 && left.length === 0;

  const searched = searchMembers(active ?? [], left ?? [], query);
  const searching = query.trim() !== "";
  const folded = searched.left.filter(
    (row) => row.left_at !== null && isLeftOverAYear(row.left_at, now),
  );
  const leftShown =
    searching || expanded
      ? searched.left
      : searched.left.filter((row) => !folded.includes(row));

  return (
    <Screen>
      <AppBar
        title="직원"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/admin")
        }
      />

      <ScrollView>
        <View className="px-5 pb-5">
          {loading ? (
            <Card>
              {SKELETON_ROWS.map((at) => (
                <SkeletonLine key={at} className="my-4 w-2/3" />
              ))}
            </Card>
          ) : empty ? (
            <Card>
              <EmptyState
                scene="no-members"
                title="아직 승인된 사람이 없어요"
                description="가입을 승인하면 여기 서요"
              />
            </Card>
          ) : (
            <>
              <Input
                placeholder="이름으로 찾기"
                value={query}
                onChangeText={setQuery}
                className="mt-2"
              />

              {searched.isEmpty ? (
                <Card className="mt-4">
                  <Text size="base" weight="medium" className="text-center">
                    맞는 이름이 없어요
                  </Text>
                </Card>
              ) : null}

              {searched.active.length > 0 ? (
                <Card className="mt-4 py-0">
                  {searched.active.map((row, at) => (
                    <ListRow
                      key={row.id}
                      title={row.display_name ?? ""}
                      detail={detailOf(
                        row.phone,
                        reach.suffixes.get(row.id) ?? null,
                      )}
                      left={
                        <Avatar
                          name={row.display_name ?? ""}
                          photoUrl={row.photo_url}
                        />
                      }
                      right={
                        row.role === "admin" ? (
                          <Badge variant="brand" label="관리자" />
                        ) : undefined
                      }
                      chevron
                      divider={at > 0}
                      onPress={() => openSheet(row)}
                    />
                  ))}
                </Card>
              ) : null}

              {leftShown.length > 0 ? (
                <>
                  <Text
                    size="xs"
                    weight="medium"
                    tone="subtle"
                    className="mt-4 py-2"
                  >
                    퇴사
                  </Text>
                  <Card className="py-0">
                    {leftShown.map((row, at) => (
                      <ListRow
                        key={row.id}
                        title={row.display_name ?? ""}
                        value={row.left_at ? spellLeftAt(row.left_at) : ""}
                        left={
                          <Avatar
                            name={row.display_name ?? ""}
                            photoUrl={row.photo_url}
                            className="opacity-60"
                          />
                        }
                        chevron
                        divider={at > 0}
                        onPress={() => openSheet(row)}
                      />
                    ))}
                    {!searching && !expanded && folded.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => setExpanded(true)}
                      >
                        더 보기
                      </Button>
                    ) : null}
                  </Card>
                </>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {open ? (
        <SheetLayer onDismiss={close}>
          <MemberSheet
            member={open}
            today={now}
            lastAdmin={isLastAdmin(active ?? [], open.id)}
            reachLine={reach.lines.get(open.id) ?? null}
            face={face}
            draft={draft}
            sending={savingName}
            failed={[nameError, roleError, leaveError, undoError].some(
              unexpected,
            )}
            onFace={showFace}
            onDraft={setDraft}
            onSaveName={() => saveName({ profileId: open.id, name: draft })}
            onRole={() =>
              setAsked(open.role === "admin" ? "demote" : "promote")
            }
            onMarkLeave={() => setAsked("leave")}
            onUndoLeave={() => setAsked("undo")}
          />
        </SheetLayer>
      ) : null}

      <MemberDialog kind={dialog} onClose={closeDialog} onConfirm={confirm} />

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
