import { ActivityIndicator, View } from "react-native";
import { ListRow } from "@/shared/ui/ListRow";
import { Text } from "@/shared/ui/Text";

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
        사진
      </Text>

      {uploading ? (
        <View className="items-center py-8">
          <ActivityIndicator />
        </View>
      ) : (
        <View className="mt-2">
          <ListRow title="사진 고르기" onPress={onPick} />
          {offerGoogle ? (
            <ListRow title="구글 사진으로" divider onPress={onUseGoogle} />
          ) : null}
          <ListRow title="닫기" divider onPress={onClose} />
        </View>
      )}

      {failed ? (
        <Text size="sm" tone="critical" className="mt-2">
          사진을 올리지 못했어요. 다시 골라 주세요
        </Text>
      ) : null}
    </>
  );
}
