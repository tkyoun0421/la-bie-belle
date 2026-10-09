import { Pencil } from "lucide-react-native";
import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import {
  AVATAR_SIZE,
  PENCIL_HIT_SLOP,
  PENCIL_ICON_SIZE,
  PROFILE_COPY,
} from "@/screens/profile/consts/profile.const";
import type { ProfileScreenController } from "@/screens/profile/hooks/useProfileScreen";
import { ProfileFacts } from "@/screens/profile/ui/ProfileFacts";
import { ProfileFactsLoading } from "@/screens/profile/ui/ProfileFactsLoading";

export type ProfileCardProps = {
  screen: ProfileScreenController;
};

export function ProfileCard({ screen }: ProfileCardProps) {
  return (
    <Card>
      <View className="items-center">
        <View className="relative">
          <Avatar
            testID="profile-avatar"
            name={screen.name}
            photoUrl={screen.photoUrl}
            size={AVATAR_SIZE}
          />
          <Button
            variant="outline"
            size="compact"
            square
            hitSlop={PENCIL_HIT_SLOP}
            className="absolute right-0 bottom-0 h-7 w-7"
            accessibilityLabel={PROFILE_COPY.editPhoto}
            onPress={screen.openPhoto}
          >
            <Icon icon={Pencil} size={PENCIL_ICON_SIZE} />
          </Button>
        </View>

        <Text size="xl" weight="semibold" className="mt-3">
          {screen.name}
        </Text>
        <Text size="sm" tone="muted" className="mt-1">
          {screen.roleLabel}
        </Text>
        <Text size="xs" tone="subtle" className="mt-2">
          {PROFILE_COPY.lockedNote}
        </Text>
      </View>

      {screen.loading ? (
        <ProfileFactsLoading />
      ) : (
        <ProfileFacts screen={screen} />
      )}
    </Card>
  );
}
