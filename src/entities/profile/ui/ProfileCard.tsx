import { Pencil } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";
import { Text } from "@/shared/ui/Text";
import {
  CARD_AVATAR_SIZE,
  PENCIL_HIT_SLOP,
  PENCIL_ICON_SIZE,
  PROFILE_CARD_COPY,
} from "@/entities/profile/consts/profile.const";
import {
  useProfileCard,
  type ProfileCardInput,
} from "@/entities/profile/hooks/useProfileCard";
import { ProfileFacts } from "@/entities/profile/ui/ProfileFacts";

export type ProfileCardProps = ProfileCardInput & {
  onEditPhoto: () => void;
  onEditContact: () => void;
  factsPending?: ReactNode;
  factsFailed?: ReactNode;
};

export function ProfileCard({
  userId,
  onEditPhoto,
  onEditContact,
  factsPending,
  factsFailed,
}: ProfileCardProps) {
  const fragment = useProfileCard({ userId });
  const ready = fragment.state === "ready" ? fragment : null;

  function facts() {
    if (fragment.state === "pending") {
      return factsPending ?? null;
    }

    if (fragment.state === "failed") {
      return factsFailed ?? null;
    }

    return (
      <ProfileFacts
        gender={fragment.gender}
        birthDate={fragment.birthDate}
        phone={fragment.phone}
        onEditContact={onEditContact}
      />
    );
  }

  return (
    <Card>
      <View className="items-center">
        <View className="relative">
          <Avatar
            testID="profile-avatar"
            name={ready?.name ?? ""}
            photoUrl={ready?.photoUrl ?? null}
            size={CARD_AVATAR_SIZE}
          />
          <Button
            variant="outline"
            size="compact"
            square
            hitSlop={PENCIL_HIT_SLOP}
            className="absolute right-0 bottom-0 h-7 w-7"
            accessibilityLabel={PROFILE_CARD_COPY.editPhoto}
            onPress={onEditPhoto}
          >
            <Icon icon={Pencil} size={PENCIL_ICON_SIZE} />
          </Button>
        </View>

        <Text size="xl" weight="semibold" className="mt-3">
          {ready?.name ?? ""}
        </Text>
        <Text size="sm" tone="muted" className="mt-1">
          {ready?.roleLabel ?? ""}
        </Text>
        <Text size="xs" tone="subtle" className="mt-2">
          {PROFILE_CARD_COPY.lockedNote}
        </Text>
      </View>

      {facts()}
    </Card>
  );
}
