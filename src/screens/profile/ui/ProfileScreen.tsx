import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Screen } from "@/shared/ui/Screen";
import { ProfileCard } from "@/entities/profile/ui/ProfileCard";
import { PROFILE_COPY } from "@/screens/profile/consts/profile.const";
import { useProfileScreen } from "@/screens/profile/hooks/useProfileScreen";
import { ProfileFactsLoading } from "@/screens/profile/ui/ProfileFactsLoading";
import { ProfileSettings } from "@/screens/profile/ui/ProfileSettings";
import { ProfileSheets } from "@/screens/profile/ui/ProfileSheets";

export function ProfileScreen() {
  const screen = useProfileScreen();

  return (
    <Screen>
      <AppBar
        title={PROFILE_COPY.appBarTitle}
        right={
          <BellIcon
            testID="bell-icon"
            unread={screen.unread}
            onPress={screen.goNotifications}
          />
        }
      />

      <ScrollView>
        <View className="gap-3 px-5 pb-5">
          <ProfileCard
            userId={screen.userId}
            onEditPhoto={screen.openPhoto}
            onEditContact={screen.openContact}
            factsLoading={<ProfileFactsLoading />}
          />

          <ProfileSettings screen={screen} />

          <Card className="py-2">
            <Button
              variant="ghost"
              loading={screen.signingOut}
              onPress={screen.leave}
            >
              {PROFILE_COPY.signOut}
            </Button>
          </Card>
        </View>
      </ScrollView>

      <ProfileSheets screen={screen} />

      {screen.toast ? (
        <FloatingToast message={screen.toast} onDone={screen.dismissToast} />
      ) : null}
    </Screen>
  );
}
