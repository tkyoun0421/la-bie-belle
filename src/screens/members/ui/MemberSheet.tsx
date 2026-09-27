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
import type { MemberRow } from "@/entities/profile/dals/list-members";
import { canSaveDisplayName } from "@/entities/profile/model/can-save-display-name";
import { formatBirthDate } from "@/entities/profile/model/format-birth-date";

/**
 * 한 사람을 여는 시트다. 재직자와 퇴사한 사람이 같은 틀을 쓰고 다른 것이 셋이다 — 퇴사한
 * 날이 이름 아래 서고, 이름 고치기와 역할 바꾸기가 없고, 더보기에 「퇴사 되돌리기」가 있다
 * (`docs/2-design/modules/account/screens/members.md`의 「퇴사한 사람 시트 짜임」).
 *
 * **얼굴이 둘인데 시트는 하나다.** 이름 고치기는 새 시트를 쌓지 않고 값이 서던 자리를 입력으로
 * 바꾼다. 사진과 이름은 그 자리에 남는다 — 고치는 대상이 같은 사람이라 화면이 바뀔 이유가 없다.
 *
 * **1년이 지나 비워진 사람은 이름과 퇴사한 날뿐이다.** 연락처도 사진도 계정도 없어 되돌릴 길이
 * 없으니 더보기가 안 선다. 시트가 서는 것은 지난 근무표의 이름이 누구였는지 확인하는 자리라서다.
 *
 * **시급 줄이 없다.** 시급 표가 서기 전에는 붙일 값이 없다 — 붙이는 것은 급여 쪽이다.
 */

const AVATAR_SIZE = 64;

const MORE_ICON_SIZE = 20;

const MORE_HIT_SLOP = 8;

const PHONE_ICON_SIZE = 18;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const GENDER_LABEL: Record<string, string> = {
  female: "여성",
  male: "남성",
};

export const MORE_TEST_ID = "members-sheet-more";

export const RENAME_INPUT_TEST_ID = "members-rename-input";

/** 「2026년 6월 30일」 — 해를 넘긴 기록이 쌓이는 자리라 연도가 붙는다. */
export function spellLeftAt(leftAt: string): string {
  const kst = new Date(Date.parse(leftAt) + KST_OFFSET_MS);

  return `${kst.getUTCFullYear()}년 ${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`;
}

export type MemberSheetFace = "detail" | "rename";

export type MemberSheetProps = {
  member: MemberRow;
  today: string;
  lastAdmin: boolean;
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
              accessibilityLabel="더보기"
              testID={MORE_TEST_ID}
              hitSlop={MORE_HIT_SLOP}
              onPress={() => setMenuOpen((open) => !open)}
            >
              <Icon icon={EllipsisVertical} size={MORE_ICON_SIZE} />
            </Pressable>
            <MorePopover open={menuOpen}>
              <MorePopoverItem
                label={left ? "퇴사 되돌리기" : "퇴사 처리"}
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

      <Avatar name={name} photoUrl={member.photo_url} size={AVATAR_SIZE} />
      <View className="mt-4 flex-row items-center gap-2">
        <Text size="xl" weight="semibold">
          {name}
        </Text>
        {admin ? <Badge variant="brand" label="관리자" /> : null}
      </View>

      {left && member.left_at ? (
        <Text size="sm" tone="subtle" numeric className="mt-1">
          {`${spellLeftAt(member.left_at)}에 퇴사했어요`}
        </Text>
      ) : null}
      {erased ? (
        <Text size="xs" tone="subtle" className="mt-1">
          1년이 지나 연락처와 사진은 지웠어요
        </Text>
      ) : null}

      {renaming ? (
        <>
          <Input
            label="이름"
            value={draft}
            testID={RENAME_INPUT_TEST_ID}
            onChangeText={onDraft}
            className="mt-6"
          />
          <Text size="xs" tone="subtle" className="mt-2">
            지난 근무표와 급여에 뜨는 이름도 같이 바뀌어요
          </Text>
        </>
      ) : erased ? null : (
        <View className="mt-6">
          <ValueRow
            label="연락처"
            numeric
            value={member.phone ?? ""}
            onPress={
              member.phone
                ? () => void Linking.openURL(`tel:${member.phone ?? ""}`)
                : undefined
            }
          />
          <ValueRow
            label="성별"
            value={GENDER_LABEL[member.gender ?? ""] ?? ""}
          />
          <ValueRow
            label="생년월일"
            numeric
            value={
              member.birth_date ? formatBirthDate(member.birth_date, today) : ""
            }
          />
        </View>
      )}

      {failed ? (
        <Text size="xs" tone="critical" className="mt-3">
          보내지 못했어요. 다시 시도해주세요
        </Text>
      ) : null}

      {renaming ? (
        <View className="mt-6 flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onPress={() => onFace("detail")}
          >
            뒤로
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={sending}
            disabled={!canSaveDisplayName(name, draft)}
            onPress={onSaveName}
          >
            저장
          </Button>
        </View>
      ) : left ? null : (
        <View className="mt-6 gap-3">
          <Button variant="secondary" onPress={() => onFace("rename")}>
            이름 고치기
          </Button>
          <Button
            variant="secondary"
            disabled={admin && lastAdmin}
            onPress={onRole}
          >
            {admin ? "관리자에서 내리기" : "관리자로 올리기"}
          </Button>
          {admin && lastAdmin ? (
            <Text size="xs" tone="subtle">
              관리자가 한 명뿐이라 내릴 수 없어요
            </Text>
          ) : null}
        </View>
      )}
    </>
  );
}
