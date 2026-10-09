import { SheetLayer } from "@/shared/ui/SheetLayer";
import { ThemeSheet } from "@/shared/ui/ThemeSheet";
import { ContactSheet } from "@/features/profileEdit/ui/ContactSheet";
import { PhotoSheet } from "@/features/profileEdit/ui/PhotoSheet";
import type { ProfileScreenController } from "@/screens/profile/hooks/useProfileScreen";

export type ProfileSheetsProps = {
  screen: ProfileScreenController;
};

export function ProfileSheets({ screen }: ProfileSheetsProps) {
  if (screen.sheet === null) {
    return null;
  }

  return (
    <SheetLayer onDismiss={screen.closeSheet}>
      {screen.sheet === "contact" && screen.profileId !== null ? (
        <ContactSheet
          profileId={screen.profileId}
          phone={screen.phone}
          onClose={screen.closeSheet}
          onSaved={screen.savedContact}
        />
      ) : null}

      {screen.sheet === "photo" ? (
        <PhotoSheet
          userId={screen.userId}
          photoUrl={screen.photoUrl}
          googlePhotoUrl={screen.googlePhotoUrl}
          onClose={screen.closeSheet}
          onSaved={screen.savedPhoto}
        />
      ) : null}

      {screen.sheet === "theme" ? (
        <ThemeSheet onChosen={screen.closeSheet} />
      ) : null}
    </SheetLayer>
  );
}
