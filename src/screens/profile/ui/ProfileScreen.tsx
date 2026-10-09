import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Dialog } from "@/shared/ui/Dialog";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Screen } from "@/shared/ui/Screen";
import { PROFILE_COPY } from "@/screens/profile/consts/profile.const";
import { useProfileScreen } from "@/screens/profile/hooks/useProfileScreen";
import { ProfileCard } from "@/screens/profile/ui/ProfileCard";
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
          <ProfileCard screen={screen} />

          <ProfileSettings screen={screen} />

          <Card className="py-2">
            <Button
              variant="ghost"
              loading={screen.signingOut}
              onPress={() => screen.signOut(screen.goLogin)}
            >
              {PROFILE_COPY.signOut}
            </Button>
          </Card>
        </View>
      </ScrollView>

      <ProfileSheets screen={screen} />

      <Dialog
        visible={screen.turningOff}
        title={PROFILE_COPY.turnOffTitle}
        closeLabel={PROFILE_COPY.turnOffClose}
        confirmLabel={PROFILE_COPY.turnOffConfirm}
        onClose={screen.cancelTurnOff}
        onConfirm={screen.confirmTurnOff}
      >
        {PROFILE_COPY.turnOffNote}
      </Dialog>

      {screen.toast ? (
        <FloatingToast message={screen.toast} onDone={screen.dismissToast} />
      ) : null}
    </Screen>
  );
}
