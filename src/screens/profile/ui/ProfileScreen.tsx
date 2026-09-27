import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Pencil } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { DomainError } from "@/shared/api/errors";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import { queryClient } from "@/shared/lib/query-client";
import { DEVICE_CLEANUP_NOT_WIRED_YET, signOut } from "@/shared/lib/sign-out";
import { supabase } from "@/shared/lib/supabase";
import type { Theme } from "@/shared/lib/theme";
import { useTheme } from "@/shared/lib/useTheme";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { BellIcon } from "@/shared/ui/BellIcon";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { Icon } from "@/shared/ui/Icon";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { SheetLayer } from "@/shared/ui/SheetLayer";
import { SkeletonLine } from "@/shared/ui/Skeleton";
import { Switch } from "@/shared/ui/Switch";
import { Text } from "@/shared/ui/Text";
import { googlePhotoOf } from "@/features/auth/google-photo-of";
import { useMyProfile } from "@/features/profile/model/useMyProfile";
import { useUpdateContact } from "@/features/profile/model/useUpdateContact";
import { useUpdatePhoto } from "@/features/profile/model/useUpdatePhoto";
import { useQualifications } from "@/features/schedule/model/useQualifications";
import { hasRehearsalGrant } from "@/screens/profile/model/has-rehearsal-grant";
import { shouldOfferGooglePhoto } from "@/screens/profile/model/should-offer-google-photo";
import { ContactSheet } from "@/screens/profile/ui/ContactSheet";
import { PhotoSheet } from "@/screens/profile/ui/PhotoSheet";
import { THEME_LABEL, ThemeSheet } from "@/screens/profile/ui/ThemeSheet";

/**
 * 근무자가 자기 것을 보고 고칠 수 있는 둘만 고치는 화면이다. 정본은
 * `docs/2-design/modules/account/screens/profile.md`고 완료 조건은
 * `docs/2-design/spec/profile-screen.md`다.
 *
 * **카드 셋이다.** 나를 말하는 카드, 설정과 문을 묶은 카드, 로그아웃 하나다
 * ([ADR-014](../../../../docs/2-design/adr/ADR-014-toss-like-depth-and-graphics.md)). 잠긴 줄과
 * 고치는 줄이 첫 카드 안에서 가는 선으로 갈리고, 다른 화면으로 나가는 문은 둘째 카드에
 * 모인다 — 눌렀을 때 시트가 열리는지 화면이 바뀌는지를 눌러 봐야 아는 일이 없게.
 *
 * **시트는 한 번에 하나다.** 연락처·사진·화면 셋이 같은 겹을 쓴다.
 *
 * 알림 스위치는 자리만이다. 켜고 끄는 일과 권한이 거부된 자리의 안내는
 * `notification-settings`가 채운다(spec 「범위 밖」).
 */

const AVATAR_SIZE = 88;

const PENCIL_ICON_SIZE = 14;

const PENCIL_HIT_SLOP = 8;

const PHOTO_EDGE = 512;

const PHOTO_QUALITY = 0.8;

const SKELETON_ROWS = [0, 1, 2];

const GENDER_LABEL: Record<string, string> = {
  female: "여성",
  male: "남성",
};

const CONTACT_SAVED = "연락처를 바꿨어요";

const PHOTO_SAVED = "사진을 바꿨어요";

type SheetName = "contact" | "photo" | "theme" | null;

type Me = { id: string; googlePhotoUrl: string | null };

/** 「1990년 11월 5일」 — 나이는 안 적는다. 그 셈이 필요한 자리는 관리자 쪽이다. */
function spellBirthDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");

  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function hyphenate(digits: string): string {
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function ProfileScreen() {
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickFailed, setPickFailed] = useState(false);

  const theme = useTheme((at) => at.theme);
  const chooseTheme = useTheme((at) => at.choose);

  const { data, isLoading } = useMyProfile(supabase, me?.id ?? null);
  const { data: grants } = useQualifications(supabase);

  const {
    mutate: saveContact,
    isPending: savingContact,
    isError: contactFailed,
    error: contactError,
    isSuccess: contactSaved,
    reset: resetContact,
  } = useUpdateContact(supabase);

  const {
    mutate: savePhoto,
    isPending: savingPhoto,
    isError: photoFailed,
    isSuccess: photoSaved,
    reset: resetPhoto,
  } = useUpdatePhoto(supabase);

  useEffect(() => {
    void getCurrentUser(supabase).then((user) =>
      setMe(
        user
          ? { id: user.id, googlePhotoUrl: googlePhotoOf(user.user_metadata) }
          : null,
      ),
    );
  }, []);

  useEffect(() => {
    if (!contactSaved) {
      return;
    }

    setSheet(null);
    setToast(CONTACT_SAVED);
    resetContact();
  }, [contactSaved, resetContact]);

  useEffect(() => {
    if (!photoSaved) {
      return;
    }

    setSheet(null);
    setToast(PHOTO_SAVED);
    resetPhoto();
  }, [photoSaved, resetPhoto]);

  const hideToast = useCallback(() => setToast(null), []);

  const closeSheet = useCallback(() => {
    setSheet(null);
    setPickFailed(false);
    resetContact();
    resetPhoto();
  }, [resetContact, resetPhoto]);

  const onSignOut = useCallback(() => {
    void signOut({
      ...DEVICE_CLEANUP_NOT_WIRED_YET,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      clearQueryClient: () => queryClient.clear(),
    }).then(() => router.replace("/login"));
  }, [router]);

  const pickPhoto = useCallback(async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (picked.canceled || !me) {
      return;
    }

    setPicking(true);
    setPickFailed(false);

    try {
      const shrunk = await ImageManipulator.manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: PHOTO_EDGE, height: PHOTO_EDGE } }],
        {
          compress: PHOTO_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      savePhoto({
        userId: me.id,
        uri: shrunk.uri,
        contentType: "image/jpeg",
        extension: "jpg",
      });
    } catch {
      setPickFailed(true);
    } finally {
      setPicking(false);
    }
  }, [me, savePhoto]);

  const onChooseTheme = useCallback(
    (chosen: Theme) => {
      chooseTheme(chosen);
      setSheet(null);
    },
    [chooseTheme],
  );

  const name = data?.display_name ?? "";
  const admin = data?.role === "admin";
  /** 관리자에게도 선다 — 전원의 리허설을 그 화면에서 본다(profile.md 「리허설」). */
  const rehearsal = admin || hasRehearsalGrant(grants ?? [], data?.id ?? null);
  const phone = data?.phone ?? "";
  const contactRejected =
    contactError instanceof DomainError &&
    contactError.code === "invalid_phone";

  return (
    <Screen>
      <AppBar
        title="나"
        right={<BellIcon onPress={() => router.push("/notifications")} />}
      />

      <ScrollView>
        <View className="gap-3 px-5 pb-5">
          <Card>
            <View className="items-center">
              <View className="relative">
                <Avatar
                  testID="profile-avatar"
                  name={name}
                  photoUrl={data?.photo_url}
                  size={AVATAR_SIZE}
                />
                <Button
                  variant="outline"
                  size="compact"
                  square
                  hitSlop={PENCIL_HIT_SLOP}
                  className="absolute right-0 bottom-0 h-7 w-7"
                  accessibilityLabel="사진 고치기"
                  onPress={() => setSheet("photo")}
                >
                  <Icon icon={Pencil} size={PENCIL_ICON_SIZE} />
                </Button>
              </View>

              <Text size="xl" weight="semibold" className="mt-3">
                {name}
              </Text>
              <Text size="sm" tone="muted" className="mt-1">
                {admin ? "관리자" : "근무자"}
              </Text>
              <Text size="xs" tone="subtle" className="mt-2">
                이름·성별·생년월일은 관리자가 고쳐요
              </Text>
            </View>

            {isLoading ? (
              <View className="mt-6">
                {SKELETON_ROWS.map((at) => (
                  <SkeletonLine key={at} className="my-4 w-2/3" />
                ))}
              </View>
            ) : (
              <View className="mt-6">
                <ListRow
                  testID="profile-gender-row"
                  title="성별"
                  value={GENDER_LABEL[data?.gender ?? ""] ?? ""}
                />
                <ListRow
                  testID="profile-birthdate-row"
                  title="생년월일"
                  divider
                  value={
                    data?.birth_date ? spellBirthDate(data.birth_date) : ""
                  }
                />
                <ListRow
                  testID="profile-contact-row"
                  title="연락처"
                  divider
                  value={phone}
                  valueTone="answer"
                  chevron
                  onPress={() => setSheet("contact")}
                />
              </View>
            )}
          </Card>

          <Card className="py-0">
            <ListRow
              title="알림"
              right={<Switch value onValueChange={() => {}} disabled />}
            />
            <ListRow
              testID="profile-theme-row"
              title="화면"
              divider
              value={THEME_LABEL[theme]}
              chevron
              onPress={() => setSheet("theme")}
            />
            <ListRow
              testID="profile-stats-row"
              title="통계"
              divider
              chevron
              onPress={() => router.push("/stats")}
            />
            {rehearsal ? (
              <ListRow
                testID="profile-rehearsal-row"
                title="리허설"
                divider
                chevron
                onPress={() => router.push("/me/rehearsals")}
              />
            ) : null}
            {admin ? (
              <ListRow
                testID="profile-admin-row"
                title="관리자 모드"
                divider
                chevron
                onPress={() => router.push("/admin")}
              />
            ) : null}
          </Card>

          <Card className="py-2">
            <Button variant="ghost" onPress={onSignOut}>
              로그아웃
            </Button>
          </Card>
        </View>
      </ScrollView>

      {sheet === "contact" ? (
        <SheetLayer onDismiss={closeSheet}>
          <ContactSheet
            phone={digitsOnly(phone)}
            saving={savingContact}
            failed={contactFailed && !contactRejected}
            rejected={contactRejected}
            onClose={closeSheet}
            onSave={(digits) =>
              data
                ? saveContact({
                    profileId: data.id,
                    phone: hyphenate(digits),
                  })
                : undefined
            }
          />
        </SheetLayer>
      ) : null}

      {sheet === "photo" ? (
        <SheetLayer onDismiss={closeSheet}>
          <PhotoSheet
            offerGoogle={shouldOfferGooglePhoto(
              data?.photo_url ?? null,
              me?.googlePhotoUrl ?? null,
            )}
            uploading={picking || savingPhoto}
            failed={pickFailed || photoFailed}
            onPick={() => void pickPhoto()}
            onUseGoogle={() =>
              me?.googlePhotoUrl
                ? savePhoto({ photoUrl: me.googlePhotoUrl })
                : undefined
            }
            onClose={closeSheet}
          />
        </SheetLayer>
      ) : null}

      {sheet === "theme" ? (
        <SheetLayer onDismiss={closeSheet}>
          <ThemeSheet theme={theme} onChoose={onChooseTheme} />
        </SheetLayer>
      ) : null}

      {toast ? <FloatingToast message={toast} onDone={hideToast} /> : null}
    </Screen>
  );
}
