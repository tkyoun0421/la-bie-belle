import { EllipsisVertical } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { MorePopover, MorePopoverItem } from "@/shared/ui/MorePopover";
import { Text } from "@/shared/ui/Text";
import {
  DETAIL_SHEET_COPY,
  MORE_HIT_SLOP,
  MORE_ICON_SIZE,
  SHEET_AVATAR_SIZE,
} from "@/features/memberAdmin/consts/memberAdmin.const";
import { useMemberDetailSheet } from "@/features/memberAdmin/hooks/useMemberDetailSheet";
import type {
  MemberDetailSheetInput,
  MemberDetailSheetValueRow,
} from "@/features/memberAdmin/model/memberDetailSheet.type";

export type MemberDetailSheetProps = MemberDetailSheetInput;

function ValueRow({ label, value, numeric }: MemberDetailSheetValueRow) {
  return (
    <View className="flex-row items-baseline justify-between gap-3 py-3">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text size="base" numeric={numeric} className="flex-1 text-right">
        {value}
      </Text>
    </View>
  );
}

export function MemberDetailSheet(props: MemberDetailSheetProps) {
  const sheet = useMemberDetailSheet(props);

  return (
    <>
      <View className="min-h-7 flex-row items-center justify-end">
        {sheet.showMenu ? (
          <View className="relative">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={DETAIL_SHEET_COPY.more}
              hitSlop={MORE_HIT_SLOP}
              onPress={sheet.toggleMenu}
            >
              <Icon icon={EllipsisVertical} size={MORE_ICON_SIZE} />
            </Pressable>
            <MorePopover open={sheet.menuOpen}>
              <MorePopoverItem
                label={DETAIL_SHEET_COPY.blockMenu}
                irreversible
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
      <Text size="xl" weight="semibold" className="mt-4">
        {sheet.name}
      </Text>

      {sheet.ask ? (
        <>
          <Text size="base" weight="medium" className="mt-6">
            {sheet.ask.question}
          </Text>
          <Text size="sm" tone="muted" className="mt-1">
            {sheet.ask.note}
          </Text>
        </>
      ) : (
        <>
          <View className="mt-6">
            {sheet.valueRows.map((row) => (
              <ValueRow key={row.label} {...row} />
            ))}
          </View>
          <Text size="xs" tone="subtle" numeric className="mt-3">
            {sheet.sentAt}
          </Text>
        </>
      )}

      {sheet.failedLine ? (
        <Text size="xs" tone="critical" className="mt-3">
          {sheet.failedLine}
        </Text>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        {sheet.ask ? (
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => sheet.showFace("detail")}
            >
              {DETAIL_SHEET_COPY.close}
            </Button>
            <Button
              variant={sheet.ask.destructive ? "destructive" : "secondary"}
              className="flex-1"
              loading={sheet.sending}
              onPress={sheet.confirm}
            >
              {sheet.ask.confirmLabel}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => sheet.showFace("reject")}
            >
              {DETAIL_SHEET_COPY.reject}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={sheet.sending}
              onPress={sheet.approve}
            >
              {DETAIL_SHEET_COPY.approve}
            </Button>
          </>
        )}
      </View>
    </>
  );
}
