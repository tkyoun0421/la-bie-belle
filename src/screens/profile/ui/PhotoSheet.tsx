import { ActivityIndicator, View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";
import { PHOTO_SHEET_COPY } from "@/screens/profile/consts/profile.const";

/**
 * 사진을 고치는 시트다. 정본은
 * `docs/2-design/modules/account/screens/profile.md`의 「사진 고치기」다.
 *
 * **「구글 사진으로」가 되돌리는 길이다.** 되돌아갈 자리가 없으면 그 줄이 아예 없다 —
 * 판정은 `shouldOfferGooglePhoto`가 한다.
 *
 * **지우는 길이 없다.** 사진은 같은 이름 둘을 가르는 근거라 비면 그 판단이 이름 하나로
 * 좁아진다.
 *
 * 올리는 동안은 줄 대신 스피너다. 올리기가 실패하면 시트가 안 닫히고 오류가 이 안에 선다.
 */

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
