import { Mars, Venus } from "lucide-react-native";
import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Divider } from "@/shared/ui/Divider";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import {
  birthYearShort,
  genderLabel,
  genderSymbol,
  restrictedQualifications,
  type Gender,
} from "@/screens/schedule-admin/model/personSheet";

/**
 * 픽커 줄을 길게 누르면 그 위에 겹쳐 올라오는 시트다. 정본은
 * `docs/2-design/modules/schedule/screens/schedule-admin.md`의 「사람 시트」다.
 *
 * **배정하지 않는다.** 읽고 닫으면 픽커 목록 그대로다 — 넣으려면 닫고 줄을 짧게 다시 누른다.
 *
 * **자격이 하나도 없으면 그 줄이 없다.** 빈 자리를 남기면 읽을 것이 있는 줄처럼 보인다.
 */

const GENDER_ICON_SIZE = 16;

export type PersonSheetProps = {
  name: string;
  photoUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  qualifications: readonly string[];
};

export function PersonSheet({
  name,
  photoUrl,
  gender,
  birthDate,
  qualifications,
}: PersonSheetProps) {
  const known =
    gender === "female" || gender === "male" ? (gender as Gender) : null;
  const facts = [
    known === null ? null : genderLabel(known),
    birthDate === null ? null : birthYearShort(birthDate),
  ].filter((fact) => fact !== null);
  const earned = restrictedQualifications(qualifications);

  return (
    <View className="items-center">
      <Avatar name={name} photoUrl={photoUrl} size={64} />

      <Text size="lg" weight="semibold" className="mt-3">
        {name}
      </Text>

      {facts.length === 0 ? null : (
        <View className="mt-1 flex-row items-center gap-1">
          {known === null ? null : (
            <Icon
              icon={genderSymbol(known) === "Venus" ? Venus : Mars}
              size={GENDER_ICON_SIZE}
              tone="muted"
            />
          )}
          <Text size="sm" tone="muted" numeric>
            {facts.join(" · ")}
          </Text>
        </View>
      )}

      {earned.length === 0 ? null : (
        <View className="mt-5 w-full">
          <Divider />
          <View className="gap-1 py-3">
            <Text size="sm" tone="subtle">
              자격
            </Text>
            <Text size="sm">{earned.join(" · ")}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
