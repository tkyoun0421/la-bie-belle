import { Card } from "@/shared/ui/Card";
import { ListRow } from "@/shared/ui/ListRow";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { PROFILE_COPY } from "@/screens/profile/consts/profile.const";
import type { ProfileScreenController } from "@/screens/profile/hooks/useProfileScreen";
import { ProfileNotificationRow } from "@/screens/profile/ui/ProfileNotificationRow";

export type ProfileSettingsProps = {
  screen: ProfileScreenController;
};

export function ProfileSettings({ screen }: ProfileSettingsProps) {
  return (
    <Card className="py-0">
      {screen.loading ? (
        <SkeletonLine className="my-4 w-2/3" />
      ) : (
        <ProfileNotificationRow screen={screen} />
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
        onPress={screen.goStats}
      />
      {screen.rehearsal ? (
        <ListRow
          testID="profile-rehearsal-row"
          title={PROFILE_COPY.rehearsalLabel}
          divider
          chevron
          onPress={screen.goRehearsals}
        />
      ) : null}
      {screen.admin ? (
        <ListRow
          testID="profile-admin-row"
          title={PROFILE_COPY.adminModeLabel}
          divider
          chevron
          onPress={screen.goAdmin}
        />
      ) : null}
    </Card>
  );
}
