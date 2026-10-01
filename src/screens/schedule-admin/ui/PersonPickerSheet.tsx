import { Mars, Venus } from "lucide-react-native";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import type { PickerRow } from "@/screens/schedule-admin/model/personPickerRows";
import { genderSymbol } from "@/screens/schedule-admin/model/personSheet";

/**
 * 빈 자리나 「교육 붙이기」를 누르면 올라오는 사람 픽커다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「사람 픽커 짜임」이다.
 *
 * **기본은 배정 가능한 사람만이다.** 나머지는 「전체 보기」 아래로 내려가고 줄마다 왜 못
 * 넣는지가 붙는다 — 배정 가능한 사람이 0명이면 한 줄과 함께 펼쳐진 채로 열린다.
 *
 * **성별 기호는 이름 바로 뒤다.** 성별은 그 사람의 것이지 줄의 것이 아니라 오른쪽 끝에
 * 세우지 않는다. 색으로 가르지 않는다(ACC-002).
 *
 * **짧게 누르면 배정이고 길게 누르면 사람 시트다.** 시트 안에 넣기 버튼을 두지 않아 같은
 * 배정에 문이 둘이 되지 않는다.
 *
 * **미신청 줄의 유일한 동작이 요청 보내기다.** 신청 안 한 날이 곧 휴무라 배정의 길이 없다
 * (SCH-016) — 체크박스로 고르고 하단 버튼 하나로 고른 전원에게 한 번에 나간다. 어느 줄에
 * 상자가 붙는지는 `classifyPickerRows`가 정한다.
 *
 * **0명이면 버튼이 없다.** 0명이라고 잠긴 버튼을 세우면 시트 아래가 늘 한 칸 눌려 있다.
 */

const GENDER_ICON_SIZE = 16;

const SHEET_HEIGHT_RATIO = 0.7;

export type PickerEntry = PickerRow & {
  photoUrl: string | null;
  gender: string | null;
};

export type PersonPickerSheetProps = {
  title: string;
  entries: readonly PickerEntry[];
  expanded: boolean;
  picked: readonly string[];
  sending: boolean;
  onExpand: () => void;
  onPick: (entry: PickerEntry) => void;
  onInspect: (entry: PickerEntry) => void;
  onToggle: (profileId: string) => void;
  onSend: () => void;
};

function PersonLine({
  entry,
  checked,
  onPick,
  onInspect,
  onToggle,
}: {
  entry: PickerEntry;
  checked: boolean;
  onPick: (entry: PickerEntry) => void;
  onInspect: (entry: PickerEntry) => void;
  onToggle: (profileId: string) => void;
}) {
  const dimmed = entry.category === "assigned";

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 py-3"
      onPress={() => onPick(entry)}
      onLongPress={() => onInspect(entry)}
    >
      <Avatar name={entry.displayName} photoUrl={entry.photoUrl} size={40} />

      <View className="flex-row items-center">
        <Text
          size="base"
          weight="medium"
          tone={dimmed ? "disabled" : "neutral"}
        >
          {entry.displayName}
        </Text>
        {entry.gender === "female" || entry.gender === "male" ? (
          <Icon
            icon={genderSymbol(entry.gender) === "Venus" ? Venus : Mars}
            size={GENDER_ICON_SIZE}
            tone={dimmed ? "disabled" : "subtle"}
            className="ml-1"
          />
        ) : null}
      </View>

      <View className="ml-auto flex-row items-center gap-3">
        {entry.message === null ? null : (
          <Text size="xs" tone="subtle">
            {entry.message}
          </Text>
        )}
        {entry.checkbox ? (
          <Checkbox
            label={entry.displayName}
            labelHidden
            checked={checked}
            onCheckedChange={() => onToggle(entry.profileId)}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

export function PersonPickerSheet({
  title,
  entries,
  expanded,
  picked,
  sending,
  onExpand,
  onPick,
  onInspect,
  onToggle,
  onSend,
}: PersonPickerSheetProps) {
  const { height } = useWindowDimensions();
  const assignable = entries.filter((entry) => entry.category === "assignable");
  const rest = entries.filter((entry) => entry.category !== "assignable");

  return (
    <>
      <Text size="lg" weight="bold">
        {title}
      </Text>

      <ScrollView style={{ maxHeight: height * SHEET_HEIGHT_RATIO }}>
        {assignable.length === 0 ? (
          <Text size="sm" tone="muted" className="py-3">
            지금 바로 넣을 수 있는 사람이 없어요
          </Text>
        ) : (
          assignable.map((entry) => (
            <PersonLine
              key={entry.profileId}
              entry={entry}
              checked={picked.includes(entry.profileId)}
              onPick={onPick}
              onInspect={onInspect}
              onToggle={onToggle}
            />
          ))
        )}

        {expanded ? (
          rest.map((entry) => (
            <PersonLine
              key={entry.profileId}
              entry={entry}
              checked={picked.includes(entry.profileId)}
              onPick={onPick}
              onInspect={onInspect}
              onToggle={onToggle}
            />
          ))
        ) : (
          <Button variant="ghost" onPress={onExpand}>
            전체 보기
          </Button>
        )}
      </ScrollView>

      {picked.length === 0 ? null : (
        <Button className="mt-3" loading={sending} onPress={onSend}>
          {`${picked.length}명에게 근무 요청 보내기`}
        </Button>
      )}
    </>
  );
}
