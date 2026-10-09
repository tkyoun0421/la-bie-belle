import { EllipsisVertical, Phone } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";
import { MorePopover, MorePopoverItem } from "@/shared/ui/MorePopover";
import { Text } from "@/shared/ui/Text";
import {
  MEMBER_SHEET_COPY,
  MORE_HIT_SLOP,
  MORE_ICON_SIZE,
  MORE_TEST_ID,
  PHONE_ICON_SIZE,
  RENAME_INPUT_TEST_ID,
  SHEET_AVATAR_SIZE,
} from "@/features/memberAdmin/consts/memberAdmin.const";
import { useMemberSheet } from "@/features/memberAdmin/hooks/useMemberSheet";
import type {
  MemberSheetInput,
  MemberSheetValueRow,
} from "@/features/memberAdmin/model/memberSheet.type";
import { MemberDialog } from "@/features/memberAdmin/ui/MemberDialog";

export type MemberSheetProps = MemberSheetInput;

function ValueRow({ label, value, numeric, press }: MemberSheetValueRow) {
  return (
    <View className="flex-row items-center justify-between gap-3 py-3">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      {press ? (
        <Pressable
          accessibilityRole="button"
          onPress={press}
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

export function MemberSheet(props: MemberSheetProps) {
  const sheet = useMemberSheet(props);

  return (
    <>
      <View className="min-h-7 flex-row items-center justify-end">
        {sheet.menuLabel ? (
          <View className="relative">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={MEMBER_SHEET_COPY.more}
              testID={MORE_TEST_ID}
              hitSlop={MORE_HIT_SLOP}
              onPress={sheet.toggleMenu}
            >
              <Icon icon={EllipsisVertical} size={MORE_ICON_SIZE} />
            </Pressable>
            <MorePopover open={sheet.menuOpen}>
              <MorePopoverItem
                label={sheet.menuLabel}
                onPress={sheet.pressMenu}
              />
            </MorePopover>
          </View>
        ) : null}
      </View>

      <Avatar
        name={sheet.name}
        photoUrl={sheet.photoUrl}
        size={SHEET_AVATAR_SIZE}
      />
      <View className="mt-4 flex-row items-center gap-2">
        <Text size="xl" weight="semibold">
          {sheet.name}
        </Text>
        {sheet.showAdminBadge ? (
          <Badge variant="brand" label={MEMBER_SHEET_COPY.adminBadge} />
        ) : null}
      </View>

      {sheet.leftLine ? (
        <Text size="sm" tone="subtle" numeric className="mt-1">
          {sheet.leftLine}
        </Text>
      ) : null}
      {sheet.erasedLine ? (
        <Text size="xs" tone="subtle" className="mt-1">
          {sheet.erasedLine}
        </Text>
      ) : null}

      {sheet.body === "rename" ? (
        <>
          <Input
            label={MEMBER_SHEET_COPY.nameLabel}
            value={sheet.draft}
            testID={RENAME_INPUT_TEST_ID}
            onChangeText={sheet.writeDraft}
            className="mt-6"
          />
          <Text size="xs" tone="subtle" className="mt-2">
            {MEMBER_SHEET_COPY.renameNote}
          </Text>
        </>
      ) : null}

      {sheet.body === "detail" ? (
        <View className="mt-6">
          {sheet.valueRows.map((row) => (
            <ValueRow key={row.label} {...row} />
          ))}
          {sheet.reachLine ? (
            <Text size="xs" tone="subtle" className="mt-1">
              {sheet.reachLine}
            </Text>
          ) : null}
        </View>
      ) : null}

      {sheet.failedLine ? (
        <Text size="xs" tone="critical" className="mt-3">
          {sheet.failedLine}
        </Text>
      ) : null}

      {sheet.footer === "rename" ? (
        <View className="mt-6 flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onPress={() => sheet.showFace("detail")}
          >
            {MEMBER_SHEET_COPY.back}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={sheet.sending}
            disabled={!sheet.canSave}
            onPress={sheet.saveName}
          >
            {MEMBER_SHEET_COPY.save}
          </Button>
        </View>
      ) : null}

      {sheet.footer === "detail" ? (
        <View className="mt-6 gap-3">
          <Button variant="secondary" onPress={() => sheet.showFace("rename")}>
            {MEMBER_SHEET_COPY.rename}
          </Button>
          <Button
            variant="secondary"
            disabled={sheet.roleDisabled}
            onPress={sheet.askRole}
          >
            {sheet.roleLabel}
          </Button>
          {sheet.lastAdminNote ? (
            <Text size="xs" tone="subtle">
              {sheet.lastAdminNote}
            </Text>
          ) : null}
        </View>
      ) : null}

      <MemberDialog
        kind={sheet.dialog}
        onClose={sheet.closeDialog}
        onConfirm={sheet.confirm}
      />
    </>
  );
}
