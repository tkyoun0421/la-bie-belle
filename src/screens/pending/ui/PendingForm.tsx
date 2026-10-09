import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { Button } from "@/shared/ui/Button";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import { PROFILE_FORM_COPY } from "@/features/profileEdit/consts/profileEdit.const";
import { PendingEditor } from "@/features/profileEdit/ui/PendingEditor";
import type { PendingScreenController } from "@/screens/pending/hooks/usePendingScreen";
import { PendingSummary } from "@/screens/pending/ui/PendingSummary";

export type PendingFormProps = {
  screen: PendingScreenController;
};

export function PendingForm({ screen }: PendingFormProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <Screen floor="plain">
        <AppBar
          title={PROFILE_FORM_COPY.appBarTitle}
          right={
            <Pressable accessibilityRole="button" onPress={screen.leave}>
              <Text size="sm" tone="subtle">
                {PROFILE_FORM_COPY.signOut}
              </Text>
            </Pressable>
          }
        />

        <View className="flex-1 px-5">
          <Text size="sm" tone="subtle">
            {screen.headline}
          </Text>

          <PendingSummary screen={screen} />

          <View className="flex-1" />

          <PendingEditor
            open={screen.open}
            userId={screen.userId}
            name={screen.values.name}
            photoUrl={screen.photoUrl}
            gender={screen.genderValue}
            birthDate={screen.values.birthDate}
            phone={screen.values.phone}
            birthDateGuide={screen.birthDateGuide}
            phoneGuide={screen.phoneGuide}
            onPhotoDone={screen.freezePhoto}
            onWriteName={screen.writeName}
            onSubmitName={screen.submitName}
            onChooseGender={screen.chooseGender}
            onWriteBirthDate={screen.writeBirthDate}
            onWritePhone={screen.writePhone}
            onTouch={screen.touch}
          />

          {screen.canSubmit ? (
            <Text size="xs" tone="subtle" className="mb-4">
              {PROFILE_FORM_COPY.lockedNote}
            </Text>
          ) : null}
        </View>

        <BottomCTA
          note={
            screen.submitFailed ? (
              <Text size="xs" tone="critical" className="text-center">
                {PROFILE_FORM_COPY.submitFailed}
              </Text>
            ) : screen.canSubmit ? null : (
              <Text size="xs" tone="subtle" className="text-center">
                {PROFILE_FORM_COPY.submitHint}
              </Text>
            )
          }
        >
          <Button
            variant="primary"
            disabled={!screen.canSubmit}
            loading={screen.submitting}
            onPress={screen.send}
          >
            {PROFILE_FORM_COPY.submit}
          </Button>
        </BottomCTA>
      </Screen>
    </KeyboardAvoidingView>
  );
}
