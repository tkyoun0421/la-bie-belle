import { EllipsisVertical } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { MorePopover, MorePopoverItem } from "@/shared/ui/MorePopover";
import { Text } from "@/shared/ui/Text";
import type { ProfilePrivate } from "@/entities/profile/model/profile.type";
import { formatBirthDate } from "@/entities/profile/utils/formatBirthDate.utils";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import {
  CONFIRM_COPY,
  MORE_HIT_SLOP,
  MORE_ICON_SIZE,
  SHEET_AVATAR_SIZE,
  SHEET_COPY,
} from "@/screens/membersPending/consts/membersPending.const";
import type { SheetFace } from "@/screens/membersPending/model/membersPending.type";

export type MemberDetailSheetProps = {
  name: string;
  photoUrl: string | null;
  sentAt: string;
  values: ProfilePrivate | null;
  today: string;
  face: SheetFace;
  sending: boolean;
  failed: boolean;
  onFace: (face: SheetFace) => void;
  onApprove: () => void;
  onConfirm: () => void;
};

type ValueRowProps = {
  label: string;
  value: string;
  numeric?: boolean;
};

function ValueRow({ label, value, numeric = false }: ValueRowProps) {
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

export function MemberDetailSheet({
  name,
  photoUrl,
  sentAt,
  values,
  today,
  face,
  sending,
  failed,
  onFace,
  onApprove,
  onConfirm,
}: MemberDetailSheetProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const asking = face === "detail" ? null : CONFIRM_COPY[face];

  return (
    <>
      <View className="min-h-7 flex-row items-center justify-end">
        {asking ? null : (
          <View className="relative">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={SHEET_COPY.more}
              hitSlop={MORE_HIT_SLOP}
              onPress={() => setMenuOpen((open) => !open)}
            >
              <Icon icon={EllipsisVertical} size={MORE_ICON_SIZE} />
            </Pressable>
            <MorePopover open={menuOpen}>
              <MorePopoverItem
                label={SHEET_COPY.blockMenu}
                irreversible
                onPress={() => {
                  setMenuOpen(false);
                  onFace("block");
                }}
              />
            </MorePopover>
          </View>
        )}
      </View>

      <Avatar name={name} photoUrl={photoUrl} size={SHEET_AVATAR_SIZE} />
      <Text size="xl" weight="semibold" className="mt-4">
        {name}
      </Text>

      {asking ? (
        <>
          <Text size="base" weight="medium" className="mt-6">
            {`${name}${asking.questionSuffix}`}
          </Text>
          <Text size="sm" tone="muted" className="mt-1">
            {asking.note}
          </Text>
        </>
      ) : (
        <>
          <View className="mt-6">
            <ValueRow
              label={SHEET_COPY.genderLabel}
              value={values === null ? "" : spellGender(values.gender)}
            />
            <ValueRow
              label={SHEET_COPY.birthLabel}
              numeric
              value={
                values?.birthDate
                  ? formatBirthDate(values.birthDate, today)
                  : ""
              }
            />
            <ValueRow
              label={SHEET_COPY.phoneLabel}
              numeric
              value={values?.phone ?? ""}
            />
            <ValueRow
              label={SHEET_COPY.emailLabel}
              value={values?.email ?? ""}
            />
          </View>
          <Text size="xs" tone="subtle" numeric className="mt-3">
            {sentAt}
          </Text>
        </>
      )}

      {failed ? (
        <Text size="xs" tone="critical" className="mt-3">
          {SHEET_COPY.sendFailed}
        </Text>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        {asking ? (
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => onFace("detail")}
            >
              {SHEET_COPY.close}
            </Button>
            <Button
              variant={face === "block" ? "destructive" : "secondary"}
              className="flex-1"
              loading={sending}
              onPress={onConfirm}
            >
              {asking.action}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => onFace("reject")}
            >
              {SHEET_COPY.reject}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={sending}
              onPress={onApprove}
            >
              {SHEET_COPY.approve}
            </Button>
          </>
        )}
      </View>
    </>
  );
}
