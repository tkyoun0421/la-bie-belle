import { Mars, Venus } from "lucide-react-native";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import type { PickerEntry } from "@/screens/scheduleAdmin/model/dayDetail.type";
import { genderSymbol } from "@/screens/scheduleAdmin/utils/personSheet.utils";

const GENDER_ICON_SIZE = 16;

const SHEET_HEIGHT_RATIO = 0.7;

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
