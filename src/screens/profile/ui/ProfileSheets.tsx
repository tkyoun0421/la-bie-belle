import { SheetLayer } from "@/shared/ui/SheetLayer";
import type { ProfileScreenController } from "@/screens/profile/hooks/useProfileScreen";
import { ContactSheet } from "@/screens/profile/ui/ContactSheet";
import { PhotoSheet } from "@/screens/profile/ui/PhotoSheet";
import { ThemeSheet } from "@/screens/profile/ui/ThemeSheet";

export type ProfileSheetsProps = {
  screen: ProfileScreenController;
};

export function ProfileSheets({ screen }: ProfileSheetsProps) {
  if (screen.sheet === null) {
    return null;
  }

  return (
    <SheetLayer onDismiss={screen.closeSheet}>
      {screen.sheet === "contact" ? (
        <ContactSheet
          draft={screen.contactDraft}
          saving={screen.contactSaving}
          failed={screen.contactFailed}
          invalid={screen.contactInvalid}
          canSave={screen.canSaveContact}
          onWrite={screen.writeContact}
          onClose={screen.closeSheet}
          onSave={screen.saveContact}
        />
      ) : null}

      {screen.sheet === "photo" ? (
        <PhotoSheet
          offerGoogle={screen.offerGoogle}
          uploading={screen.uploading}
          failed={screen.photoFailed}
          onPick={() => void screen.pickPhoto()}
          onUseGoogle={screen.useGooglePhoto}
          onClose={screen.closeSheet}
        />
      ) : null}

      {screen.sheet === "theme" ? (
        <ThemeSheet theme={screen.theme} onChoose={screen.chooseTheme} />
      ) : null}
    </SheetLayer>
  );
}
