import type { ReactNode } from "react";
import { View } from "react-native";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Divider } from "@/shared/ui/Divider";
import { Text } from "@/shared/ui/Text";
import { PROFILE_FORM_COPY } from "@/features/profileEdit/consts/profileEdit.const";
import { EMAIL_AVATAR_SIZE } from "@/screens/pending/consts/pending.const";

export type PendingFooterProps = {
  email: string;
  photoUrl: string | null;
  signingOut: boolean;
  signOutVariant: "ghost" | "outline";
  children?: ReactNode;
  onSignOut: () => void;
};

export function PendingFooter({
  email,
  photoUrl,
  signingOut,
  signOutVariant,
  children,
  onSignOut,
}: PendingFooterProps) {
  return (
    <>
      <Divider className="my-5" />
      <View className="flex-row items-center justify-center gap-3">
        <Avatar name={email} photoUrl={photoUrl} size={EMAIL_AVATAR_SIZE} />
        <Text size="sm" tone="subtle">
          {email}
        </Text>
      </View>
      {children}
      <Button
        variant={signOutVariant}
        className="mt-4"
        loading={signingOut}
        onPress={onSignOut}
      >
        {PROFILE_FORM_COPY.signOut}
      </Button>
    </>
  );
}
