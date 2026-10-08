import { ActivityIndicator, View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import { PHOTO_SHEET_COPY } from "@/screens/profile/consts/profile.const";

export type PhotoSheetProps = {
  offerGoogle: boolean;
  uploading: boolean;
  failed: boolean;
  onPick: () => void;
  onUseGoogle: () => void;
  onClose: () => void;
};

export function PhotoSheet({
  offerGoogle,
  uploading,
  failed,
  onPick,
  onUseGoogle,
  onClose,
}: PhotoSheetProps) {
  return (
    <>
      <Text size="lg" weight="semibold">
        {PHOTO_SHEET_COPY.title}
      </Text>

      {uploading ? (
        <View className="items-center py-8">
          <ActivityIndicator />
        </View>
      ) : (
        <View className="mt-2">
          <ListRow title={PHOTO_SHEET_COPY.pick} onPress={onPick} />
          {offerGoogle ? (
            <ListRow
              title={PHOTO_SHEET_COPY.useGoogle}
              divider
              onPress={onUseGoogle}
            />
          ) : null}
          <ListRow title={PHOTO_SHEET_COPY.close} divider onPress={onClose} />
        </View>
      )}

      {failed ? (
        <Text size="sm" tone="critical" className="mt-2">
          {PHOTO_SHEET_COPY.failed}
        </Text>
      ) : null}
    </>
  );
}
