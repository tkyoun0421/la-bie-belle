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
import type { Member } from "@/entities/member/model/member.type";
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

export type MemberSheetProps = {
  member: Member;
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

  const name = member.displayName ?? "";
  const left = member.leftAt !== null;
  const erased = member.erasedAt !== null;
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

      <Avatar name={name} photoUrl={member.photoUrl} size={SHEET_AVATAR_SIZE} />
      <View className="mt-4 flex-row items-center gap-2">
        <Text size="xl" weight="semibold">
          {name}
        </Text>
        {admin ? (
          <Badge variant="brand" label={MEMBERS_COPY.adminBadge} />
        ) : null}
      </View>

      {left && member.leftAt ? (
        <Text size="sm" tone="subtle" numeric className="mt-1">
          {`${spellLeftAt(member.leftAt)}${MEMBER_SHEET_COPY.leftSuffix}`}
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
              member.birthDate ? formatBirthDate(member.birthDate, today) : ""
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
