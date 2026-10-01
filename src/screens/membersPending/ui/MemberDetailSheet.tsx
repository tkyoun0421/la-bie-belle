import { EllipsisVertical } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { MorePopover, MorePopoverItem } from "@/shared/ui/MorePopover";
import { Text } from "@/shared/ui/Text";
import type { ProfilePrivateRow } from "@/entities/profile/dals/profilePrivate";
import { formatBirthDate } from "@/entities/profile/model/formatBirthDate";

/**
 * 대기 중인 한 사람을 여는 시트다. 관리자가 사람을 알아보는 재료 넷과 보낸 시각을 세우고
 * 거기서 판정한다 — 정본은
 * `docs/2-design/modules/account/screens/members-pending.md`의 「상세 시트 짜임」이다.
 *
 * **얼굴이 셋인데 시트는 하나다.** 거절과 차단은 새 시트를 쌓지 않고 이 시트의 값 넷 자리를
 * 물음으로 바꾼다. 사진과 이름은 그 자리에 남는다 — 묻는 대상이 같은 사람이라 화면이 바뀔
 * 이유가 없다. 물음이 선 동안 더보기는 감춘다.
 */

const AVATAR_SIZE = 64;

const MORE_ICON_SIZE = 20;

const MORE_HIT_SLOP = 8;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const GENDER_LABEL: Record<string, string> = {
  female: "여성",
  male: "남성",
};

/** 「9월 9일(수) 21:04에 보냈어요」 — 목록과 달리 시트는 언제인지를 그대로 말한다. */
function formatSentAt(submittedAt: string): string {
  const kst = new Date(Date.parse(submittedAt) + KST_OFFSET_MS);
  const hour = String(kst.getUTCHours()).padStart(2, "0");
  const minute = String(kst.getUTCMinutes()).padStart(2, "0");

  return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일(${WEEKDAYS[kst.getUTCDay()]}) ${hour}:${minute}에 보냈어요`;
}

export type MemberDecision = "reject" | "block";

export type SheetFace = "detail" | MemberDecision;

const CONFIRM_COPY: Record<
  MemberDecision,
  { question: (name: string) => string; note: string; action: string }
> = {
  reject: {
    question: (name) => `${name} 님을 안 받을까요`,
    note: "다시 보내면 목록에 또 떠요",
    action: "거절",
  },
  block: {
    question: (name) => `${name} 님을 차단할까요`,
    note: "이 구글 계정으로는 다시 못 들어와요",
    action: "차단",
  },
};

export type MemberDetailSheetProps = {
  name: string;
  photoUrl: string | null;
  submittedAt: string | null;
  values: ProfilePrivateRow | null;
  today: string;
  face: SheetFace;
  sending: boolean;
  failed: boolean;
  onFace: (face: SheetFace) => void;
  onApprove: () => void;
  onConfirm: (decision: MemberDecision) => void;
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
  submittedAt,
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
  const confirming = face !== "detail";

  return (
    <>
      <View className="min-h-7 flex-row items-center justify-end">
        {confirming ? null : (
          <View className="relative">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="더보기"
              hitSlop={MORE_HIT_SLOP}
              onPress={() => setMenuOpen((open) => !open)}
            >
              <Icon icon={EllipsisVertical} size={MORE_ICON_SIZE} />
            </Pressable>
            <MorePopover open={menuOpen}>
              <MorePopoverItem
                label="차단하기"
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

      <Avatar name={name} photoUrl={photoUrl} size={AVATAR_SIZE} />
      <Text size="xl" weight="semibold" className="mt-4">
        {name}
      </Text>

      {confirming ? (
        <>
          <Text size="base" weight="medium" className="mt-6">
            {CONFIRM_COPY[face].question(name)}
          </Text>
          <Text size="sm" tone="muted" className="mt-1">
            {CONFIRM_COPY[face].note}
          </Text>
        </>
      ) : (
        <>
          <View className="mt-6">
            <ValueRow
              label="성별"
              value={values ? (GENDER_LABEL[values.gender ?? ""] ?? "") : ""}
            />
            <ValueRow
              label="생년월일"
              numeric
              value={
                values?.birth_date
                  ? formatBirthDate(values.birth_date, today)
                  : ""
              }
            />
            <ValueRow label="연락처" numeric value={values?.phone ?? ""} />
            <ValueRow label="구글 계정" value={values?.email ?? ""} />
          </View>
          <Text size="xs" tone="subtle" numeric className="mt-3">
            {submittedAt ? formatSentAt(submittedAt) : ""}
          </Text>
        </>
      )}

      {failed ? (
        <Text size="xs" tone="critical" className="mt-3">
          보내지 못했어요. 다시 시도해주세요
        </Text>
      ) : null}

      <View className="mt-6 flex-row gap-3">
        {confirming ? (
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => onFace("detail")}
            >
              닫기
            </Button>
            <Button
              variant={face === "block" ? "destructive" : "secondary"}
              className="flex-1"
              loading={sending}
              onPress={() => onConfirm(face)}
            >
              {CONFIRM_COPY[face].action}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              className="flex-1"
              onPress={() => onFace("reject")}
            >
              거절
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={sending}
              onPress={onApprove}
            >
              승인
            </Button>
          </>
        )}
      </View>
    </>
  );
}
