import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import { LOGIN_PATH } from "@/shared/consts/navigation.const";
import { APP_STATE } from "@/shared/lib/appState.lib";
import {
  isProfileGender,
  validateProfileForm,
  type ProfileFormErrors,
  type ProfileGender,
} from "@/entities/profile/model/profile.schema";
import { useProfilePrivateQuery } from "@/entities/profile/services/useProfilePrivateQuery";
import {
  digitsOfBirthDate,
  isoDateOfDigits,
  spellBirthDate,
} from "@/entities/profile/utils/birthDateDigits.utils";
import {
  digitsOnly,
  hyphenatePhone,
} from "@/entities/profile/utils/phoneDigits.utils";
import { spellGender } from "@/entities/profile/utils/spellGender.utils";
import { useMyStanding } from "@/features/auth/hooks/useMyStanding";
import { useSignOutMutation } from "@/features/auth/services/useSignOutMutation";
import {
  PROFILE_FORM_COPY,
  PROFILE_FORM_STEPS,
} from "@/features/profileEdit/consts/profileEdit.const";
import { firstOpenStep } from "@/features/profileEdit/model/profileFormStep.policy";
import type { ProfileFormStep } from "@/features/profileEdit/model/profileFormStep.type";
import { useSubmitProfileMutation } from "@/features/profileEdit/services/useSubmitProfileMutation";
import { PUSH_DEPS } from "@/features/pushSwitch/lib/pushDeps.lib";
import { requestPushPermission } from "@/features/pushSwitch/lib/pushPermission.lib";
import { useSavePushTokenMutation } from "@/features/pushSwitch/services/useSavePushTokenMutation";
import {
  BIRTH_DATE_LENGTH,
  CELEBRATION_STAY_MS,
  EMPTY_PENDING_FORM,
  INITIAL_NOTIFICATION_PROMPT_VIEW,
  PENDING_PHONE_LENGTH,
  PROMPT_OUTCOME_OF,
  ROTATE_INTERVAL_MS,
  ROTATING_LINES,
} from "@/screens/pending/consts/pending.const";
import {
  transitionNotificationPromptView,
  type NotificationPromptCopy,
  type NotificationPromptView,
} from "@/screens/pending/model/notificationPrompt.policy";
import { stageOfProfile } from "@/screens/pending/model/pendingForm.policy";
import type {
  PendingFormValues,
  PendingStage,
} from "@/screens/pending/model/pendingForm.type";
import { getNotificationPromptCopy } from "@/screens/pending/utils/notificationPromptCopy.utils";

export type PendingScreenController = {
  stage: PendingStage;
  userId: string | null;
  email: string;
  photoUrl: string | null;
  name: string;
  open: ProfileFormStep | null;
  shown: Record<ProfileFormStep, boolean>;
  values: PendingFormValues;
  headline: string;
  nameLine: string;
  genderLine: string;
  genderValue: string;
  birthDateLine: string;
  phoneLine: string;
  birthDateGuide: string | undefined;
  phoneGuide: string | undefined;
  submitting: boolean;
  submitFailed: boolean;
  canSubmit: boolean;
  rotatingLine: string;
  prompt: NotificationPromptCopy;
  promptTone: NotificationPromptView;
  signingOut: boolean;
  writeName: (typed: string) => void;
  submitName: () => void;
  chooseGender: (picked: string) => void;
  writeBirthDate: (typed: string) => void;
  writePhone: (typed: string) => void;
  touch: (step: ProfileFormStep) => void;
  thaw: (step: ProfileFormStep) => void;
  freezePhoto: () => void;
  send: () => void;
  retry: () => void;
  turnOnNotifications: () => Promise<void>;
  leave: () => void;
  goLogin: () => void;
};

export function usePendingScreen(): PendingScreenController {
  const router = useRouter();
  const [seeded, setSeeded] = useState(false);
  const [override, setOverride] = useState<PendingStage | null>(null);
  const [values, setValues] = useState<PendingFormValues>(EMPTY_PENDING_FORM);
  const [frozen, setFrozen] = useState<ProfileFormStep[]>([]);
  const [touched, setTouched] = useState<ProfileFormStep[]>([]);
  const [everSubmitted, setEverSubmitted] = useState(false);
  const [line, setLine] = useState(0);
  const [promptView, setPromptView] = useState<NotificationPromptView>(
    INITIAL_NOTIFICATION_PROMPT_VIEW,
  );
  const [pushToken, setPushToken] = useState<string | null>(null);

  useSavePushTokenMutation(supabase, pushToken, APP_STATE);

  const { user, profile } = useMyStanding(supabase);
  const privateQuery = useProfilePrivateQuery(supabase, profile?.id ?? null);

  const {
    mutate: sendProfile,
    isPending: submitting,
    isSuccess: submitted,
    isError: submitFailed,
    reset: resetSubmit,
  } = useSubmitProfileMutation(supabase);

  const { signOut, isPending: signingOut } = useSignOutMutation(supabase);

  const freeze = useCallback((step: ProfileFormStep) => {
    setFrozen((at) => (at.includes(step) ? at : [...at, step]));
  }, []);

  const loading =
    user === undefined ||
    (user !== null &&
      (profile === undefined ||
        (profile !== null && privateQuery.data === undefined)));

  useEffect(() => {
    if (seeded || loading || !user) {
      return;
    }

    const contact = privateQuery.data ?? null;
    const gender = isProfileGender(contact?.gender) ? contact.gender : null;
    const answered =
      contact !== null || (profile?.submittedAt ?? null) !== null;

    setValues({
      name: profile?.displayName ?? "",
      gender,
      birthDate: digitsOfBirthDate(contact?.birthDate ?? null),
      phone: digitsOnly(contact?.phone ?? "", PENDING_PHONE_LENGTH),
    });
    setFrozen(answered ? [...PROFILE_FORM_STEPS] : []);
    setEverSubmitted(answered);
    setSeeded(true);
  }, [seeded, loading, user, profile, privateQuery.data]);

  useEffect(() => {
    if (submitted) {
      setOverride(everSubmitted ? "waiting" : "celebrating");
      setEverSubmitted(true);
      resetSubmit();
    }
  }, [submitted, everSubmitted, resetSubmit]);

  const stage: PendingStage = loading
    ? "loading"
    : user === null
      ? "signedOut"
      : (override ?? stageOfProfile(profile ?? null));

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

    const timer = setTimeout(() => setOverride("waiting"), CELEBRATION_STAY_MS);

    return () => clearTimeout(timer);
  }, [stage]);

  const open = firstOpenStep(frozen);
  const errors: ProfileFormErrors = validateProfileForm(values);

  const guideOf = (step: "birthDate" | "phone"): string | undefined =>
    touched.includes(step) ? errors[step] : undefined;

  const writeChecked = (step: "birthDate" | "phone", next: string) => {
    const edited = { ...values, [step]: next };

    setValues(edited);

    if (validateProfileForm(edited)[step] === undefined) {
      freeze(step);
    }
  };

  const freezePhoto = useCallback(() => freeze("photo"), [freeze]);

  const turnOnNotifications = useCallback(async () => {
    const asked = await requestPushPermission(PUSH_DEPS);

    if (asked.permission === "granted" && asked.token !== null) {
      setPushToken(asked.token);
    }

    setPromptView((at) =>
      transitionNotificationPromptView(at, PROMPT_OUTCOME_OF[asked.permission]),
    );
  }, []);

  const goLogin = useCallback(() => {
    router.replace(LOGIN_PATH);
  }, [router]);

  const leave = useCallback(() => {
    signOut(goLogin);
  }, [signOut, goLogin]);

  return {
    stage,
    userId: user?.id ?? null,
    email: user?.email ?? "",
    photoUrl: profile?.photoUrl ?? user?.googlePhotoUrl ?? null,
    name: values.name,
    open,
    shown: {
      photo: frozen.includes("photo"),
      name: frozen.includes("name"),
      gender: frozen.includes("gender") && values.gender !== null,
      birthDate: frozen.includes("birthDate"),
      phone: frozen.includes("phone"),
    },
    values,
    headline:
      open === null ? PROFILE_FORM_COPY.reviewing : PROFILE_FORM_COPY.writing,
    nameLine: `${values.name}${PROFILE_FORM_COPY.greetingSuffix}`,
    genderLine: spellGender(values.gender),
    genderValue: values.gender ?? "",
    birthDateLine: spellBirthDate(values.birthDate),
    phoneLine: hyphenatePhone(values.phone),
    birthDateGuide: guideOf("birthDate"),
    phoneGuide: guideOf("phone"),
    submitting,
    submitFailed,
    canSubmit: open === null,
    rotatingLine: ROTATING_LINES[line],
    prompt: getNotificationPromptCopy(promptView),
    promptTone: promptView,
    signingOut,
    writeName: (typed: string) => setValues((at) => ({ ...at, name: typed })),
    submitName: () => {
      if (values.name.trim() !== "") {
        freeze("name");
      }
    },
    chooseGender: (picked: string) => {
      if (isProfileGender(picked)) {
        setValues((at) => ({ ...at, gender: picked as ProfileGender }));
        freeze("gender");
      }
    },
    writeBirthDate: (typed: string) =>
      writeChecked("birthDate", digitsOnly(typed, BIRTH_DATE_LENGTH)),
    writePhone: (typed: string) =>
      writeChecked("phone", digitsOnly(typed, PENDING_PHONE_LENGTH)),
    touch: (step: ProfileFormStep) =>
      setTouched((at) => (at.includes(step) ? at : [...at, step])),
    thaw: (step: ProfileFormStep) =>
      setFrozen((at) => at.filter((frozenStep) => frozenStep !== step)),
    freezePhoto,
    send: () =>
      sendProfile({
        displayName: values.name.trim(),
        phone: hyphenatePhone(values.phone),
        birthDate: isoDateOfDigits(values.birthDate),
        gender: values.gender ?? "",
      }),
    retry: () => setOverride("form"),
    turnOnNotifications,
    leave,
    goLogin,
  };
}
