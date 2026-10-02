import { EllipsisVertical, Phone } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";
import { MorePopover, MorePopoverItem } from "@/shared/ui/MorePopover";
import { Text } from "@/shared/ui/Text";
import type { MemberRow } from "@/entities/member/api/member.dto";
import { canSaveDisplayName } from "@/entities/profile/model/canSaveDisplayName.policy";
import { formatBirthDate } from "@/entities/profile/utils/formatBirthDate.utils";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import {
  MEMBERS_COPY,
  MEMBER_SHEET_COPY,
  MORE_HIT_SLOP,
  MORE_ICON_SIZE,
  MORE_TEST_ID,
  PHONE_ICON_SIZE,
  RENAME_INPUT_TEST_ID,
  SHEET_AVATAR_SIZE,
} from "@/screens/members/consts/members.const";
import type { MemberSheetFace } from "@/screens/members/model/members.type";
import { spellLeftAt } from "@/screens/members/utils/spellLeftAt.utils";

/**
 * 한 사람을 여는 시트다. 재직자와 퇴사한 사람이 같은 틀을 쓰고 다른 것이 셋이다 — 퇴사한
 * 날이 이름 아래 서고, 이름 고치기와 역할 바꾸기가 없고, 더보기에 「퇴사 되돌리기」가 있다
 * (`docs/2-design/modules/account/screens/members.md`의 「퇴사한 사람 시트 짜임」).
 *
 * **얼굴이 둘인데 시트는 하나다.** 이름 고치기는 새 시트를 쌓지 않고 값이 서던 자리를 입력으로
 * 바꾼다. 사진과 이름은 그 자리에 남는다 — 고치는 대상이 같은 사람이라 화면이 바뀔 이유가 없다.
 *
 * **더보기 열림만 이 조각이 든다.** 사람이 열고 사람이 닫고 통신에 안 매여 있어 UI 상태다 —
 * 얼굴과 적는 이름은 보낸 것의 결과에 매여 있어
 * [`useMembersScreen`](../hooks/useMembersScreen.ts)이 든다.
 *
 * **1년이 지나 비워진 사람은 이름과 퇴사한 날뿐이다.** 연락처도 사진도 계정도 없어 되돌릴 길이
 * 없으니 더보기가 안 선다. 시트가 서는 것은 지난 근무표의 이름이 누구였는지 확인하는 자리라서다.
 *
 * **시급 줄이 없다.** 시급 표가 서기 전에는 붙일 값이 없다 — 붙이는 것은 급여 쪽이다.
 *
 * **알림을 못 받는 사람에게는 프로필 아래 한 줄이 더 선다.** 목록 줄의 한 마디를 여기서는
 * 문장으로 편다 — 관리자가 전화하기 전에 무슨 말을 할지가 그 줄에 있다. 고치는 길은 없다 —
 * 관리자가 남의 알림을 켜주지 못한다([NTF-022](../../../../docs/2-design/modules/notification/README.md#ntf-022)).
 */

export type MemberSheetProps = {
  member: MemberRow;
  today: string;
  lastAdmin: boolean;
  reachLine: string | null;
  face: MemberSheetFace;
  draft: string;
  sending: boolean;
  failed: boolean;
  onFace: (face: MemberSheetFace) => void;
  onDraft: (value: string) => void;
  onSaveName: () => void;
  onRole: () => void;
  onMarkLeave: () => void;
  onUndoLeave: () => void;
};

type ValueRowProps = {
  label: string;
  value: string;
  numeric?: boolean;
  onPress?: () => void;
};

function ValueRow({ label, value, numeric = false, onPress }: ValueRowProps) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-3">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          className="flex-1 flex-row items-center justify-end gap-2"
        >
          <Text size="base" numeric={numeric}>
            {value}
          </Text>
          <Icon icon={Phone} size={PHONE_ICON_SIZE} />
        </Pressable>
      ) : (
        <Text size="base" numeric={numeric} className="flex-1 text-right">
          {value}
        </Text>
      )}
    </View>
  );
}

export function MemberSheet({
  member,
  today,
  lastAdmin,
  reachLine,
  face,
  draft,
  sending,
  failed,
  onFace,
  onDraft,
  onSaveName,
  onRole,
  onMarkLeave,
  onUndoLeave,
}: MemberSheetProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const name = member.display_name ?? "";
  const left = member.left_at !== null;
  const erased = member.erased_at !== null;
  const admin = member.role === "admin";
  const renaming = face === "rename";

  return (
    <>
      <View className="min-h-7 flex-row items-center justify-end">
        {renaming || erased ? null : (
          <View className="relative">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={MEMBER_SHEET_COPY.more}
              testID={MORE_TEST_ID}
              hitSlop={MORE_HIT_SLOP}
              onPress={() => setMenuOpen((open) => !open)}
            >
              <Icon icon={EllipsisVertical} size={MORE_ICON_SIZE} />
            </Pressable>
            <MorePopover open={menuOpen}>
              <MorePopoverItem
                label={
                  left
                    ? MEMBER_SHEET_COPY.undoLeave
                    : MEMBER_SHEET_COPY.markLeave
                }
                onPress={() => {
                  setMenuOpen(false);
                  if (left) {
                    onUndoLeave();
                  } else {
                    onMarkLeave();
                  }
                }}
              />
            </MorePopover>
          </View>
        )}
      </View>

      <Avatar
        name={name}
        photoUrl={member.photo_url}
        size={SHEET_AVATAR_SIZE}
      />
      <View className="mt-4 flex-row items-center gap-2">
        <Text size="xl" weight="semibold">
          {name}
        </Text>
        {admin ? (
          <Badge variant="brand" label={MEMBERS_COPY.adminBadge} />
        ) : null}
      </View>

      {left && member.left_at ? (
        <Text size="sm" tone="subtle" numeric className="mt-1">
          {`${spellLeftAt(member.left_at)}${MEMBER_SHEET_COPY.leftSuffix}`}
        </Text>
      ) : null}
      {erased ? (
        <Text size="xs" tone="subtle" className="mt-1">
          {MEMBER_SHEET_COPY.erased}
        </Text>
      ) : null}

      {renaming ? (
        <>
          <Input
            label={MEMBER_SHEET_COPY.nameLabel}
            value={draft}
            testID={RENAME_INPUT_TEST_ID}
            onChangeText={onDraft}
            className="mt-6"
          />
          <Text size="xs" tone="subtle" className="mt-2">
            {MEMBER_SHEET_COPY.renameNote}
          </Text>
        </>
      ) : erased ? null : (
        <View className="mt-6">
          <ValueRow
            label={MEMBER_SHEET_COPY.phoneLabel}
            numeric
            value={member.phone ?? ""}
            onPress={
              member.phone
                ? () => void Linking.openURL(`tel:${member.phone ?? ""}`)
                : undefined
            }
          />
          <ValueRow
            label={MEMBER_SHEET_COPY.genderLabel}
            value={spellGender(member.gender)}
          />
          <ValueRow
            label={MEMBER_SHEET_COPY.birthLabel}
            numeric
            value={
              member.birth_date ? formatBirthDate(member.birth_date, today) : ""
            }
          />
          {reachLine ? (
            <Text size="xs" tone="subtle" className="mt-1">
              {reachLine}
            </Text>
          ) : null}
        </View>
      )}

      {failed ? (
        <Text size="xs" tone="critical" className="mt-3">
          {MEMBER_SHEET_COPY.sendFailed}
        </Text>
      ) : null}

      {renaming ? (
        <View className="mt-6 flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onPress={() => onFace("detail")}
          >
            {MEMBER_SHEET_COPY.back}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={sending}
            disabled={!canSaveDisplayName(name, draft)}
            onPress={onSaveName}
          >
            {MEMBER_SHEET_COPY.save}
          </Button>
        </View>
      ) : left ? null : (
        <View className="mt-6 gap-3">
          <Button variant="secondary" onPress={() => onFace("rename")}>
            {MEMBER_SHEET_COPY.rename}
          </Button>
          <Button
            variant="secondary"
            disabled={admin && lastAdmin}
            onPress={onRole}
          >
            {admin ? MEMBER_SHEET_COPY.demote : MEMBER_SHEET_COPY.promote}
          </Button>
          {admin && lastAdmin ? (
            <Text size="xs" tone="subtle">
              {MEMBER_SHEET_COPY.lastAdminNote}
            </Text>
          ) : null}
        </View>
      )}
    </>
  );
}
