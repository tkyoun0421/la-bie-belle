import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCurrentUser } from "@/shared/lib/get-current-user";
import { queryClient } from "@/shared/lib/query-client";
import { DEVICE_CLEANUP_NOT_WIRED_YET, signOut } from "@/shared/lib/sign-out";
import { supabase } from "@/shared/lib/supabase";
import { AppBar } from "@/shared/ui/AppBar";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { BottomCTA } from "@/shared/ui/BottomCTA";
import { Button } from "@/shared/ui/Button";
import { CelebrationCircle } from "@/shared/ui/CelebrationCircle";
import { Divider } from "@/shared/ui/Divider";
import { Illustration } from "@/shared/ui/Illustration";
import { Input } from "@/shared/ui/Input";
import { Screen } from "@/shared/ui/Screen";
import { Segment } from "@/shared/ui/Segment";
import { Text } from "@/shared/ui/Text";
import { uploadAvatar } from "@/entities/profile/dals/avatars-bucket";
import { getMyProfile } from "@/entities/profile/dals/get-my-profile";
import { getMyProfilePrivate } from "@/entities/profile/dals/profile-private";
import { submitProfile } from "@/entities/profile/dals/submit-profile";
import { updateMyPhoto } from "@/entities/profile/dals/update-my-photo";
import { googlePhotoOf } from "@/features/auth/google-photo-of";
import {
  isProfileGender,
  validateProfileForm,
  type ProfileGender,
} from "@/features/profile/model/validate-profile";

/**
 * 로그인한 사람이 프로필을 적어 가입을 끝내는 자리다. 한 경로가 장면 넷을 든다 — 프로필
 * 작성, 보낸 뒤의 축하, 승인 대기, 거절된 뒤. 정본은
 * `docs/2-design/modules/account/screens/login.md`고 완료 조건은
 * `docs/2-design/spec/profile-form.md`다.
 *
 * **칸은 하나고 자리가 고정이다.** 다섯을 한 장에 세우지 않는다. 지금 답할 것 하나만 화면
 * 아래에서 묻고, 규칙에 맞으면 그 칸이 위 더미로 올라가 굳는다. 굳은 것을 누르면 다시
 * 물음으로 내려온다. 그래서 이 화면의 상태는 「값 다섯」과 「굳은 것이 무엇인가」 둘이고,
 * 열려 있는 칸은 늘 「아직 안 굳은 첫 스텝」으로 계산된다 — 따로 들고 있지 않는다.
 *
 * **축하는 계정마다 한 번이다.** 거절 뒤 다시 보낸 것이면 축하 없이 바로 승인 대기다.
 * 한 번이라도 보낸 적이 있는지는 개인정보 행이 있는지로 안다 — 차단이 풀린 사람은
 * `submitted_at`이 비워진 채 지난 값만 남아서 그 자리에 다시 선다.
 *
 * 알림 켜기 자리는 `notification-settings`가 채운다(spec 「승인 근거」의 제한).
 */

const STEPS = ["photo", "name", "gender", "birthDate", "phone"] as const;

type Step = (typeof STEPS)[number];

type Stage = "loading" | "form" | "celebrating" | "waiting" | "rejected";

const ROTATING_LINES = [
  "이번 달 근무표를 한눈에 봐요",
  "출근은 현장에서 찍어요",
  "일한 시간과 급여를 같이 봐요",
];

const ROTATE_INTERVAL_MS = 4000;

const CELEBRATION_STAY_MS = 1200;

const AVATAR_SIZE = 64;

const PHOTO_EDGE = 512;

const PHOTO_QUALITY = 0.8;

const SCREEN_BOTTOM_PADDING = 24;

const GENDER_LABEL: Record<ProfileGender, string> = {
  female: "여성",
  male: "남성",
};

function digitsOnly(value: string, limit: number): string {
  return value.replace(/\D/g, "").slice(0, limit);
}

/** 칸은 숫자만 받고 하이픈은 앱이 넣는다. 굳은 글과 서버가 보는 꼴이 같다. */
function hyphenatePhone(digits: string): string {
  if (digits.length < 8) {
    return digits;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** 칸에서는 여덟 자리지만 글로 서면 년·월·일이 말로 갈린다. */
function spellBirthDate(digits: string): string {
  const year = digits.slice(0, 4);
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));

  return `${year}년 ${month}월 ${day}일`;
}

function toDigits(isoDate: string | null): string {
  return isoDate === null ? "" : isoDate.replaceAll("-", "");
}

function toIsoDate(digits: string): string {
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

type FormValues = {
  name: string;
  gender: ProfileGender | null;
  birthDate: string;
  phone: string;
  photoUrl: string | null;
};

const EMPTY_VALUES: FormValues = {
  name: "",
  gender: null,
  birthDate: "",
  phone: "",
  photoUrl: null,
};

function firstOpenStep(frozen: readonly Step[]): Step | null {
  return STEPS.find((step) => !frozen.includes(step)) ?? null;
}

export function PendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stage, setStage] = useState<Stage>("loading");
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [frozen, setFrozen] = useState<Step[]>([]);
  const [everSubmitted, setEverSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState<Step[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [line, setLine] = useState(0);

  useEffect(() => {
    let abandoned = false;

    void (async () => {
      const user = await getCurrentUser(supabase);

      if (!user) {
        router.replace("/login");
        return;
      }

      const profile = await getMyProfile(supabase, user.id);
      const priv = profile
        ? await getMyProfilePrivate(supabase, profile.id)
        : null;

      if (abandoned) {
        return;
      }

      const gender = priv && isProfileGender(priv.gender) ? priv.gender : null;
      const answered = priv !== null || profile?.submitted_at !== null;

      setEmail(user.email ?? "");
      setValues({
        name: profile?.display_name ?? "",
        gender,
        birthDate: toDigits(priv?.birth_date ?? null),
        phone: digitsOnly(priv?.phone ?? "", 11),
        photoUrl: profile?.photo_url ?? googlePhotoOf(user.user_metadata),
      });
      setFrozen(answered ? [...STEPS] : []);
      setEverSubmitted(answered);
      setStage(
        profile?.rejected_at
          ? "rejected"
          : profile?.submitted_at
            ? "waiting"
            : "form",
      );
    })();

    return () => {
      abandoned = true;
    };
  }, [router]);

  useEffect(() => {
    if (stage !== "waiting") {
      return;
    }

    const timer = setInterval(
      () => setLine((at) => (at + 1) % ROTATING_LINES.length),
      ROTATE_INTERVAL_MS,
    );

    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "celebrating") {
      return;
    }

    const timer = setTimeout(() => setStage("waiting"), CELEBRATION_STAY_MS);

    return () => clearTimeout(timer);
  }, [stage]);

  const onSignOut = useCallback(() => {
    void signOut({
      ...DEVICE_CLEANUP_NOT_WIRED_YET,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      clearQueryClient: () => queryClient.clear(),
    }).then(() => router.replace("/login"));
  }, [router]);

  const freeze = useCallback((step: Step) => {
    setFrozen((at) => (at.includes(step) ? at : [...at, step]));
  }, []);

  const thaw = useCallback((step: Step) => {
    setFrozen((at) => at.filter((frozenStep) => frozenStep !== step));
  }, []);

  const pickPhoto = useCallback(async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (picked.canceled) {
      return;
    }

    setUploading(true);
    setPhotoFailed(false);

    try {
      const user = await getCurrentUser(supabase);

      if (!user) {
        throw new Error("not_allowed");
      }

      const shrunk = await ImageManipulator.manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: PHOTO_EDGE, height: PHOTO_EDGE } }],
        {
          compress: PHOTO_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      const publicUrl = await uploadAvatar(supabase, {
        userId: user.id,
        uri: shrunk.uri,
        contentType: "image/jpeg",
        extension: "jpg",
      });

      await updateMyPhoto(supabase, publicUrl);

      setValues((at) => ({ ...at, photoUrl: publicUrl }));
      freeze("photo");
    } catch {
      setPhotoFailed(true);
    } finally {
      setUploading(false);
    }
  }, [freeze]);

  const send = useCallback(async () => {
    setSubmitting(true);
    setSubmitFailed(false);

    try {
      await submitProfile(supabase, {
        displayName: values.name.trim(),
        phone: hyphenatePhone(values.phone),
        birthDate: toIsoDate(values.birthDate),
        gender: values.gender ?? "",
      });

      setStage(everSubmitted ? "waiting" : "celebrating");
      setEverSubmitted(true);
    } catch {
      setSubmitFailed(true);
    } finally {
      setSubmitting(false);
    }
  }, [everSubmitted, values]);

  if (stage === "loading") {
    return <Screen floor="plain" />;
  }

  if (stage === "celebrating") {
    return (
      <Screen floor="plain" className="items-center justify-center px-6">
        <CelebrationCircle name={values.name} photoUrl={values.photoUrl} />
        <Text size="2xl" weight="semibold" className="mt-6">
          {values.name}님, 반가워요
        </Text>
      </Screen>
    );
  }

  if (stage === "waiting" || stage === "rejected") {
    const rejected = stage === "rejected";

    return (
      <Screen
        floor="plain"
        style={{ paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom }}
        className="px-6"
      >
        <View className="flex-1 items-center justify-center">
          {rejected ? (
            <Badge variant="neutral" size="md" label="아직 연결 전" />
          ) : (
            <>
              <Illustration scene="waiting" />
              <Badge variant="brand" size="md" dot label="승인 기다리는 중" />
            </>
          )}
          <Text size="xl" weight="bold" className="mt-4 text-center">
            {rejected ? "이번엔 연결이 안 됐어요" : "관리자가 확인 중이에요"}
          </Text>
          <Text size="sm" tone="muted" className="mt-2 text-center">
            {rejected
              ? "프로필을 고쳐서 다시 보낼 수 있어요"
              : ROTATING_LINES[line]}
          </Text>
        </View>

        <View>
          <Divider className="my-5" />
          <View className="flex-row items-center justify-center gap-3">
            <Avatar name={email} photoUrl={values.photoUrl} size={24} />
            <Text size="sm" tone="subtle">
              {email}
            </Text>
          </View>
          {rejected ? (
            <Button
              variant="primary"
              className="mt-4"
              onPress={() => setStage("form")}
            >
              다시 보내기
            </Button>
          ) : null}
          <Button
            variant={rejected ? "ghost" : "outline"}
            className="mt-4"
            onPress={onSignOut}
          >
            로그아웃
          </Button>
        </View>
      </Screen>
    );
  }

  const open = firstOpenStep(frozen);
  const errors = validateProfileForm({
    name: values.name,
    phone: values.phone,
    birthDate: values.birthDate,
    gender: values.gender,
  });
  const guideOf = (step: "birthDate" | "phone"): string | undefined =>
    touched.includes(step) ? errors[step] : undefined;

  const isFrozen = (step: Step) => frozen.includes(step);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <Screen floor="plain">
        <AppBar
          title="프로필"
          right={
            <Pressable accessibilityRole="button" onPress={onSignOut}>
              <Text size="sm" tone="subtle">
                로그아웃
              </Text>
            </Pressable>
          }
        />

        <View className="flex-1 px-6">
          <Text size="sm" tone="subtle">
            {open === null
              ? "아래 정보가 맞나요? 틀린 부분을 누르면 다시 적을 수 있어요"
              : "자신의 프로필을 작성해 주세요"}
          </Text>

          <View className="mt-6">
            {isFrozen("photo") ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => thaw("photo")}
                className="self-center"
              >
                <Avatar
                  name={values.name}
                  photoUrl={values.photoUrl}
                  size={AVATAR_SIZE}
                />
              </Pressable>
            ) : null}

            {isFrozen("name") ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => thaw("name")}
                className="mt-6"
              >
                <Text size="xl" weight="semibold">
                  {values.name}님, 반가워요
                </Text>
              </Pressable>
            ) : null}

            {isFrozen("gender") && values.gender ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => thaw("gender")}
                className="mt-3"
              >
                <Text size="lg" weight="medium">
                  {GENDER_LABEL[values.gender]}
                </Text>
              </Pressable>
            ) : null}

            {isFrozen("birthDate") ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => thaw("birthDate")}
                className="mt-3"
              >
                <Text size="lg" weight="medium" numeric>
                  {spellBirthDate(values.birthDate)}
                </Text>
              </Pressable>
            ) : null}

            {isFrozen("phone") ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => thaw("phone")}
                className="mt-3"
              >
                <Text size="lg" weight="medium" numeric>
                  {hyphenatePhone(values.phone)}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View className="flex-1" />

          {open === "photo" ? (
            <View className="mb-4 items-center">
              <Pressable
                accessibilityRole="button"
                disabled={uploading}
                onPress={() => void pickPhoto()}
              >
                <Avatar
                  name={values.name}
                  photoUrl={values.photoUrl}
                  size={AVATAR_SIZE}
                />
              </Pressable>
              <Button
                variant="outline"
                size="md"
                className="mt-4"
                loading={uploading}
                onPress={() => freeze("photo")}
              >
                기본 사진 쓰기
              </Button>
              {photoFailed ? (
                <Text size="xs" tone="critical" className="mt-1.5">
                  사진을 올리지 못했어요. 다시 골라 주세요
                </Text>
              ) : null}
            </View>
          ) : null}

          {open === "name" ? (
            <Input
              className="mb-4"
              label="이름"
              placeholder="근무표에 뜰 이름"
              value={values.name}
              returnKeyType="done"
              onChangeText={(name) => setValues((at) => ({ ...at, name }))}
              onSubmitEditing={() => {
                if (values.name.trim() !== "") {
                  freeze("name");
                }
              }}
            />
          ) : null}

          {open === "gender" ? (
            <View className="mb-4">
              <Text size="xs" tone="muted" className="mb-1.5">
                성별
              </Text>
              <Segment
                options={[
                  { value: "female", label: "여" },
                  { value: "male", label: "남" },
                ]}
                value={values.gender ?? ""}
                onChange={(picked) => {
                  if (isProfileGender(picked)) {
                    setValues((at) => ({ ...at, gender: picked }));
                    freeze("gender");
                  }
                }}
              />
            </View>
          ) : null}

          {open === "birthDate" ? (
            <Input
              className="mb-4"
              label="생년월일"
              placeholder="19930421"
              keyboardType="number-pad"
              value={values.birthDate}
              error={guideOf("birthDate")}
              onBlur={() => setTouched((at) => [...at, "birthDate"])}
              onChangeText={(typed) => {
                const birthDate = digitsOnly(typed, 8);

                setValues((at) => ({ ...at, birthDate }));

                if (
                  validateProfileForm({ ...values, birthDate }).birthDate ===
                  undefined
                ) {
                  freeze("birthDate");
                }
              }}
            />
          ) : null}

          {open === "phone" ? (
            <Input
              className="mb-4"
              label="연락처"
              placeholder="010-0000-0000"
              keyboardType="number-pad"
              value={values.phone}
              error={guideOf("phone")}
              onBlur={() => setTouched((at) => [...at, "phone"])}
              onChangeText={(typed) => {
                const phone = digitsOnly(typed, 11);

                setValues((at) => ({ ...at, phone }));

                if (
                  validateProfileForm({ ...values, phone }).phone === undefined
                ) {
                  freeze("phone");
                }
              }}
            />
          ) : null}

          {open === null ? (
            <Text size="xs" tone="subtle" className="mb-4">
              이름과 성별과 생년월일은 보내고 나면 못 고쳐요
            </Text>
          ) : null}
        </View>

        <BottomCTA
          note={
            submitFailed ? (
              <Text size="xs" tone="critical" className="text-center">
                보내지 못했어요. 다시 시도해주세요
              </Text>
            ) : open === null ? null : (
              <Text size="xs" tone="subtle" className="text-center">
                빈 칸을 다 채우면 보낼 수 있어요
              </Text>
            )
          }
        >
          <Button
            variant="primary"
            disabled={open !== null}
            loading={submitting}
            onPress={() => void send()}
          >
            보내기
          </Button>
        </BottomCTA>
      </Screen>
    </KeyboardAvoidingView>
  );
}
