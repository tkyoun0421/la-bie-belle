import { Redirect, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/shared/api/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { Button } from "@/shared/ui/Button";
import { CelebrationCircle } from "@/shared/ui/CelebrationCircle";
import { Divider } from "@/shared/ui/Divider";
import { Illustration } from "@/shared/ui/Illustration";
import { Input } from "@/shared/ui/Input";
import { PushNotice } from "@/shared/ui/PushNotice";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { Text } from "@/shared/ui/Text";
import {
  EMAIL_AVATAR_SIZE,
  GENDER_OPTIONS,
  NOTIFICATION_PROMPT_BUTTON,
  PENDING_AVATAR_SIZE,
  PENDING_FORM_COPY,
  PENDING_WAIT_COPY,
  SCREEN_BOTTOM_PADDING,
} from "@/screens/pending/consts/pending.const";
import { usePendingScreen } from "@/screens/pending/hooks/usePendingScreen";

/**
 * 로그인한 사람이 프로필을 적어 가입을 끝내는 자리다. 한 경로가 장면 넷을 든다 — 프로필
 * 작성, 보낸 뒤의 축하, 승인 대기, 거절된 뒤. 정본은
 * `docs/2-design/modules/account/screens/login.md`고 완료 조건은
 * `docs/2-design/spec/profile-form.md`다.
 *
 * **칸은 하나고 자리가 고정이다.** 다섯을 한 장에 세우지 않는다. 지금 답할 것 하나만 화면
 * 아래에서 묻고, 굳은 것은 위 더미로 올라간다. 굳은 것을 누르면 다시 물음으로 내려온다.
 *
 * 값과 굳은 것과 장면은 `usePendingScreen`이 든다. 여기 남은 것은 그림과 보낼 데다.
 */

export function PendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screen = usePendingScreen(supabase);

  /**
   * 세션이 끊긴 채로 이 경로에 서 있을 자리가 없다. 효과가 아니라 선언으로 보내는 것은
   * `.tsx`가 `useEffect`를 안 들기 때문이고(ADR-015), 보낼 데를 화면이 쥐는 것은 그대로다.
   */
  if (screen.stage === "signedOut") {
    return <Redirect href="/login" />;
  }

  if (screen.stage === "loading") {
    return <Screen floor="plain" />;
  }

  if (screen.stage === "celebrating") {
    return (
      <Screen floor="plain" className="items-center justify-center px-5">
        <CelebrationCircle name={screen.name} photoUrl={screen.photoUrl} />
        <Text size="2xl" weight="semibold" className="mt-6">
          {screen.nameLine}
        </Text>
      </Screen>
    );
  }

  if (screen.stage === "waiting" || screen.stage === "rejected") {
    const rejected = screen.stage === "rejected";

    return (
      <Screen
        floor="plain"
        style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
        className="px-5"
      >
        <View className="flex-1 items-center justify-center">
          {rejected ? (
            <Badge
              variant="neutral"
              size="md"
              label={PENDING_WAIT_COPY.rejectedBadge}
            />
          ) : (
            <>
              <Illustration scene="waiting" />
              <Badge
                variant="brand"
                size="md"
                dot
                label={PENDING_WAIT_COPY.waitingBadge}
              />
            </>
          )}
          <Text size="xl" weight="bold" className="mt-4 text-center">
            {rejected
              ? PENDING_WAIT_COPY.rejectedTitle
              : PENDING_WAIT_COPY.waitingTitle}
          </Text>
          <Text size="sm" tone="muted" className="mt-2 text-center">
            {rejected ? PENDING_WAIT_COPY.rejectedSubline : screen.rotatingLine}
          </Text>
        </View>

        <View>
          {rejected ? null : (
            <PushNotice
              tone={screen.promptTone}
              title={screen.prompt.title}
              subline={screen.prompt.subline}
              action={
                screen.prompt.hasButton ? (
                  <Button
                    variant="primary"
                    size="md"
                    onPress={() => void screen.turnOnNotifications()}
                  >
                    {NOTIFICATION_PROMPT_BUTTON}
                  </Button>
                ) : undefined
              }
            />
          )}
          <Divider className="my-5" />
          <View className="flex-row items-center justify-center gap-3">
            <Avatar
              name={screen.email}
              photoUrl={screen.photoUrl}
              size={EMAIL_AVATAR_SIZE}
            />
            <Text size="sm" tone="subtle">
              {screen.email}
            </Text>
          </View>
          {rejected ? (
            <Button variant="primary" className="mt-4" onPress={screen.retry}>
              {PENDING_WAIT_COPY.retry}
            </Button>
          ) : null}
          <Button
            variant={rejected ? "ghost" : "outline"}
            className="mt-4"
            loading={screen.signingOut}
            onPress={() => screen.signOut(() => router.replace("/login"))}
          >
            {PENDING_FORM_COPY.signOut}
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <Screen floor="plain">
        <AppBar
          title={PENDING_FORM_COPY.appBarTitle}
          right={
            <Pressable
              accessibilityRole="button"
              onPress={() => screen.signOut(() => router.replace("/login"))}
            >
              <Text size="sm" tone="subtle">
                {PENDING_FORM_COPY.signOut}
              </Text>
            </Pressable>
          }
        />

        <View className="flex-1 px-5">
          <Text size="sm" tone="subtle">
            {screen.canSubmit
              ? PENDING_FORM_COPY.reviewing
              : PENDING_FORM_COPY.writing}
          </Text>

          <View className="mt-6">
            {screen.shown.photo ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => screen.thaw("photo")}
                className="self-center"
              >
                <Avatar
                  name={screen.name}
                  photoUrl={screen.photoUrl}
                  size={PENDING_AVATAR_SIZE}
                />
              </Pressable>
            ) : null}

            {screen.shown.name ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => screen.thaw("name")}
                className="mt-6"
              >
                <Text size="xl" weight="semibold">
                  {screen.nameLine}
                </Text>
              </Pressable>
            ) : null}

            {screen.shown.gender ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => screen.thaw("gender")}
                className="mt-3"
              >
                <Text size="lg" weight="medium">
                  {screen.genderLine}
                </Text>
              </Pressable>
            ) : null}

            {screen.shown.birthDate ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => screen.thaw("birthDate")}
                className="mt-3"
              >
                <Text size="lg" weight="medium" numeric>
                  {screen.birthDateLine}
                </Text>
              </Pressable>
            ) : null}

            {screen.shown.phone ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => screen.thaw("phone")}
                className="mt-3"
              >
                <Text size="lg" weight="medium" numeric>
                  {screen.phoneLine}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View className="flex-1" />

          {screen.open === "photo" ? (
            <View className="mb-4 items-center">
              <Pressable
                accessibilityRole="button"
                disabled={screen.uploading}
                onPress={() => void screen.pickPhoto()}
              >
                <Avatar
                  name={screen.name}
                  photoUrl={screen.photoUrl}
                  size={PENDING_AVATAR_SIZE}
                />
              </Pressable>
              <Button
                variant="outline"
                size="md"
                className="mt-4"
                loading={screen.uploading}
                onPress={screen.freezePhoto}
              >
                {PENDING_FORM_COPY.useDefaultPhoto}
              </Button>
              {screen.photoFailed ? (
                <Text size="xs" tone="critical" className="mt-1.5">
                  {PENDING_FORM_COPY.photoFailed}
                </Text>
              ) : null}
            </View>
          ) : null}

          {screen.open === "name" ? (
            <Input
              className="mb-4"
              label={PENDING_FORM_COPY.nameLabel}
              placeholder={PENDING_FORM_COPY.namePlaceholder}
              value={screen.values.name}
              returnKeyType="done"
              onChangeText={screen.writeName}
              onSubmitEditing={screen.submitName}
            />
          ) : null}

          {screen.open === "gender" ? (
            <View className="mb-4">
              <Text size="xs" tone="muted" className="mb-1.5">
                {PENDING_FORM_COPY.genderLabel}
              </Text>
              <Segment
                options={[...GENDER_OPTIONS]}
                value={screen.values.gender ?? ""}
                onChange={screen.chooseGender}
              />
            </View>
          ) : null}

          {screen.open === "birthDate" ? (
            <Input
              className="mb-4"
              label={PENDING_FORM_COPY.birthDateLabel}
              placeholder={PENDING_FORM_COPY.birthDatePlaceholder}
              keyboardType="number-pad"
              value={screen.values.birthDate}
              error={screen.birthDateGuide}
              onBlur={() => screen.touch("birthDate")}
              onChangeText={screen.writeBirthDate}
            />
          ) : null}

          {screen.open === "phone" ? (
            <Input
              className="mb-4"
              label={PENDING_FORM_COPY.phoneLabel}
              placeholder={PENDING_FORM_COPY.phonePlaceholder}
              keyboardType="number-pad"
              value={screen.values.phone}
              error={screen.phoneGuide}
              onBlur={() => screen.touch("phone")}
              onChangeText={screen.writePhone}
            />
          ) : null}

          {screen.canSubmit ? (
            <Text size="xs" tone="subtle" className="mb-4">
              {PENDING_FORM_COPY.lockedNote}
            </Text>
          ) : null}
        </View>

        <BottomCTA
          note={
            screen.submitFailed ? (
              <Text size="xs" tone="critical" className="text-center">
                {PENDING_FORM_COPY.submitFailed}
              </Text>
            ) : screen.canSubmit ? null : (
              <Text size="xs" tone="subtle" className="text-center">
                {PENDING_FORM_COPY.submitHint}
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
            {PENDING_FORM_COPY.submit}
          </Button>
        </BottomCTA>
      </Screen>
    </KeyboardAvoidingView>
  );
}
