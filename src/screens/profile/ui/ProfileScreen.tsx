import { usePathname, useRouter } from "expo-router";
import { Pencil } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Dialog } from "@/shared/ui/Dialog";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { ListRow } from "@/shared/ui/ListRow";
import { PushNotice } from "@/shared/ui/PushNotice";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Switch } from "@/shared/ui/Switch";
import { Text } from "@/shared/ui/Text";
import {
  AVATAR_SIZE,
  PENCIL_HIT_SLOP,
  PENCIL_ICON_SIZE,
  PROFILE_COPY,
} from "@/screens/profile/consts/profile.const";
import { useProfileScreen } from "@/screens/profile/hooks/useProfileScreen";
import { ContactSheet } from "@/screens/profile/ui/ContactSheet";
import { PhotoSheet } from "@/screens/profile/ui/PhotoSheet";
import { ThemeSheet } from "@/screens/profile/ui/ThemeSheet";

const SKELETON_ROWS = [0, 1, 2];

export function ProfileScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const screen = useProfileScreen();

  return (
    <Screen>
      <AppBar
        title={PROFILE_COPY.appBarTitle}
        right={
          <BellIcon
            testID="bell-icon"
            unread={screen.unread}
            onPress={() => router.push(`/notifications?from=${pathname}`)}
          />
        }
      />

      <ScrollView>
        <View className="gap-3 px-5 pb-5">
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
              <View className="mt-6">
                {SKELETON_ROWS.map((at) => (
                  <SkeletonLine key={at} className="my-4 w-2/3" />
                ))}
              </View>
            ) : (
              <View className="mt-6">
                <ListRow
                  testID="profile-gender-row"
                  title={PROFILE_COPY.genderLabel}
                  value={screen.gender}
                />
                <ListRow
                  testID="profile-birthdate-row"
                  title={PROFILE_COPY.birthDateLabel}
                  divider
                  value={screen.birthDate}
                />
                <ListRow
                  testID="profile-contact-row"
                  title={PROFILE_COPY.contactLabel}
                  divider
                  value={screen.phone}
                  valueTone="answer"
                  chevron
                  onPress={screen.openContact}
                />
              </View>
            )}
          </Card>

          <Card className="py-0">
            {screen.loading ? (
              <SkeletonLine className="my-4 w-2/3" />
            ) : screen.notificationRow.kind === "switch" ? (
              <ListRow
                title={PROFILE_COPY.notificationLabel}
                right={
                  <Switch
                    testID="notification-switch"
                    value={screen.notificationEnabled}
                    disabled={screen.notificationRow.state === "locked"}
                    onValueChange={(next) =>
                      next ? screen.turnOnNotifications() : screen.askTurnOff()
                    }
                  />
                }
              />
            ) : (
              <PushNotice
                className="my-4"
                tone="denied"
                title={screen.notificationRow.title}
                subline={screen.notificationRow.subline}
              />
            )}
            <ListRow
              testID="profile-theme-row"
              title={PROFILE_COPY.themeLabel}
              divider
              value={screen.themeLabel}
              chevron
              onPress={screen.openTheme}
            />
            <ListRow
              testID="profile-stats-row"
              title={PROFILE_COPY.statsLabel}
              divider
              chevron
              onPress={() => router.push("/stats")}
            />
            {screen.rehearsal ? (
              <ListRow
                testID="profile-rehearsal-row"
                title={PROFILE_COPY.rehearsalLabel}
                divider
                chevron
                onPress={() => router.push("/me/rehearsals")}
              />
            ) : null}
            {screen.admin ? (
              <ListRow
                testID="profile-admin-row"
                title={PROFILE_COPY.adminModeLabel}
                divider
                chevron
                onPress={() => router.push("/admin")}
              />
            ) : null}
          </Card>

          <Card className="py-2">
            <Button
              variant="ghost"
              loading={screen.signingOut}
              onPress={() => screen.signOut(() => router.replace("/login"))}
            >
              {PROFILE_COPY.signOut}
            </Button>
          </Card>
        </View>
      </ScrollView>

      {screen.sheet === "contact" ? (
        <SheetLayer onDismiss={screen.closeSheet}>
          <ContactSheet
            draft={screen.contactDraft}
            saving={screen.contactSaving}
            failed={screen.contactFailed}
            invalid={screen.contactInvalid || screen.contactRejected}
            canSave={screen.canSaveContact}
            onWrite={screen.writeContact}
            onClose={screen.closeSheet}
            onSave={screen.saveContact}
          />
        </SheetLayer>
      ) : null}

      {screen.sheet === "photo" ? (
        <SheetLayer onDismiss={screen.closeSheet}>
          <PhotoSheet
            offerGoogle={screen.offerGoogle}
            uploading={screen.uploading}
            failed={screen.photoFailed}
            onPick={() => void screen.pickPhoto()}
            onUseGoogle={screen.useGooglePhoto}
            onClose={screen.closeSheet}
          />
        </SheetLayer>
      ) : null}

      {screen.sheet === "theme" ? (
        <SheetLayer onDismiss={screen.closeSheet}>
          <ThemeSheet theme={screen.theme} onChoose={screen.chooseTheme} />
        </SheetLayer>
      ) : null}

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
