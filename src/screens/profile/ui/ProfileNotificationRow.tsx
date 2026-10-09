import { ListRow } from "@/shared/ui/ListRow";
import { PushNotice } from "@/shared/ui/PushNotice";
import { Switch } from "@/shared/ui/Switch";
import { PROFILE_COPY } from "@/screens/profile/consts/profile.const";
import type { ProfileScreenController } from "@/screens/profile/hooks/useProfileScreen";

export type ProfileNotificationRowProps = {
  screen: ProfileScreenController;
};

export function ProfileNotificationRow({
  screen,
}: ProfileNotificationRowProps) {
  if (screen.notificationRow.kind === "switch") {
    return (
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
    );
  }

  return (
    <PushNotice
      className="my-4"
      tone="denied"
      title={screen.notificationRow.title}
      subline={screen.notificationRow.subline}
    />
  );
}
