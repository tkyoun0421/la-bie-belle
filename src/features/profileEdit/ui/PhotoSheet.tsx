import { ActivityIndicator, View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import { PHOTO_SHEET_COPY } from "@/features/profileEdit/consts/profileEdit.const";
import { usePhotoSheet } from "@/features/profileEdit/hooks/usePhotoSheet";

export type PhotoSheetProps = {
  userId: string | null;
  photoUrl: string | null;
  googlePhotoUrl: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function PhotoSheet({
  userId,
  photoUrl,
  googlePhotoUrl,
  onClose,
  onSaved,
}: PhotoSheetProps) {
  const fragment = usePhotoSheet({
    userId,
    photoUrl,
    googlePhotoUrl,
    onSaved,
  });

  return (
    <>
      <Text size="lg" weight="semibold">
        {PHOTO_SHEET_COPY.title}
      </Text>

      {fragment.uploading ? (
        <View className="items-center py-8">
          <ActivityIndicator />
        </View>
      ) : (
        <View className="mt-2">
          <ListRow
            title={PHOTO_SHEET_COPY.pick}
            onPress={() => void fragment.pick()}
          />
          {fragment.offerGoogle ? (
            <ListRow
              title={PHOTO_SHEET_COPY.useGoogle}
              divider
              onPress={fragment.useGoogle}
            />
          ) : null}
          <ListRow title={PHOTO_SHEET_COPY.close} divider onPress={onClose} />
        </View>
      )}

      {fragment.failed ? (
        <Text size="sm" tone="critical" className="mt-2">
          {PHOTO_SHEET_COPY.failed}
        </Text>
      ) : null}
    </>
  );
}
