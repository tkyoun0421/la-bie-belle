import { Pressable, View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Text } from "@/shared/ui/Text";
import { PENDING_AVATAR_SIZE } from "@/screens/pending/consts/pending.const";
import type { PendingScreenController } from "@/screens/pending/hooks/usePendingScreen";

export type PendingSummaryProps = {
  screen: PendingScreenController;
};

export function PendingSummary({ screen }: PendingSummaryProps) {
  return (
    <View className="mt-6">
      {screen.shown.photo ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => screen.thaw("photo")}
          className="self-center"
        >
          <Avatar
            name={screen.name}
            photoUrl={screen.photoUrl}
            size={PENDING_AVATAR_SIZE}
          />
        </Pressable>
      ) : null}

      {screen.shown.name ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => screen.thaw("name")}
          className="mt-6"
        >
          <Text size="xl" weight="semibold">
            {screen.nameLine}
          </Text>
        </Pressable>
      ) : null}

      {screen.shown.gender ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => screen.thaw("gender")}
          className="mt-3"
        >
          <Text size="lg" weight="medium">
            {screen.genderLine}
          </Text>
        </Pressable>
      ) : null}

      {screen.shown.birthDate ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => screen.thaw("birthDate")}
          className="mt-3"
        >
          <Text size="lg" weight="medium" numeric>
            {screen.birthDateLine}
          </Text>
        </Pressable>
      ) : null}

      {screen.shown.phone ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => screen.thaw("phone")}
          className="mt-3"
        >
          <Text size="lg" weight="medium" numeric>
            {screen.phoneLine}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
