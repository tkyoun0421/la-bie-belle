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
import { useMyProfileRowQuery } from "@/entities/profile/services/useMyProfileRowQuery";
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
import { useSessionUserQuery } from "@/entities/session/services/useSessionUserQuery";
import { useSignOutMutation } from "@/features/auth/services/useSignOutMutation";
import { PHOTO_PICK_DEPS } from "@/features/profileEdit/lib/photoPickDeps.lib";
import { pickAndShrinkPhoto } from "@/features/profileEdit/lib/pickPhoto.lib";
import { useSubmitProfileMutation } from "@/features/profileEdit/services/useSubmitProfileMutation";
import { useUpdatePhotoMutation } from "@/features/profileEdit/services/useUpdatePhotoMutation";
import { PUSH_DEPS } from "@/features/pushSwitch/lib/pushDeps.lib";
import { requestPushPermission } from "@/features/pushSwitch/lib/pushPermission.lib";
import { useSavePushTokenMutation } from "@/features/pushSwitch/services/useSavePushTokenMutation";
import {
  BIRTH_DATE_LENGTH,
  CELEBRATION_STAY_MS,
  INITIAL_NOTIFICATION_PROMPT_VIEW,
  PENDING_FORM_COPY,
  PENDING_PHONE_LENGTH,
  PROMPT_OUTCOME_OF,
  ROTATE_INTERVAL_MS,
  ROTATING_LINES,
} from "@/screens/pending/consts/pending.const";
import {
  EMPTY_PENDING_FORM,
  PENDING_STEPS,
} from "@/screens/pending/consts/pending.const";
import {
  transitionNotificationPromptView,
  type NotificationPromptCopy,
  type NotificationPromptView,
} from "@/screens/pending/model/notificationPrompt.policy";
import {
  firstOpenStep,
  stageOfProfile,
} from "@/screens/pending/model/pendingForm.policy";
import type {
  PendingFormValues,
  PendingStage,
  Step,
} from "@/screens/pending/model/pendingForm.type";
import { getNotificationPromptCopy } from "@/screens/pending/utils/notificationPromptCopy.utils";

export type PendingScreenController = {
  stage: PendingStage;
  email: string;
  photoUrl: string | null;
  name: string;
  open: Step | null;
  shown: Record<Step, boolean>;
  values: PendingFormValues;
  headline: string;
  nameLine: string;
  genderLine: string;
  genderValue: string;
  birthDateLine: string;
  phoneLine: string;
  birthDateGuide: string | undefined;
  phoneGuide: string | undefined;
  uploading: boolean;
  photoFailed: boolean;
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
  touch: (step: Step) => void;
  thaw: (step: Step) => void;
  freezePhoto: () => void;
  pickPhoto: () => Promise<void>;
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
  const [frozen, setFrozen] = useState<Step[]>([]);
  const [touched, setTouched] = useState<Step[]>([]);
  const [everSubmitted, setEverSubmitted] = useState(false);
  const [pickFailed, setPickFailed] = useState(false);
  const [picking, setPicking] = useState(false);
  const [line, setLine] = useState(0);
  const [promptView, setPromptView] = useState<NotificationPromptView>(
    INITIAL_NOTIFICATION_PROMPT_VIEW,
  );
  const [pushToken, setPushToken] = useState<string | null>(null);

  useSavePushTokenMutation(supabase, pushToken, APP_STATE);

  const { data: me } = useSessionUserQuery(supabase);
  const { data: profile } = useMyProfileRowQuery(supabase, me?.id ?? null);
  const privateQuery = useProfilePrivateQuery(supabase, profile?.id ?? null);

  const {
    mutate: sendProfile,
    isPending: submitting,
    isSuccess: submitted,
    isError: submitFailed,
    reset: resetSubmit,
  } = useSubmitProfileMutation(supabase);

  const {
    mutate: sendPhoto,
    isPending: savingPhoto,
    isSuccess: photoSaved,
    isError: photoSaveFailed,
    reset: resetPhoto,
  } = useUpdatePhotoMutation(supabase);

  const { signOut, isPending: signingOut } = useSignOutMutation(supabase);

  const freeze = useCallback((step: Step) => {
    setFrozen((at) => (at.includes(step) ? at : [...at, step]));
  }, []);

  const loading =
    me === undefined ||
    (me !== null &&
      (profile === undefined ||
        (profile !== null && privateQuery.data === undefined)));

  useEffect(() => {
    if (seeded || loading || !me) {
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
    setFrozen(answered ? [...PENDING_STEPS] : []);
    setEverSubmitted(answered);
    setSeeded(true);
  }, [seeded, loading, me, profile, privateQuery.data]);

  useEffect(() => {
    if (submitted) {
      setOverride(everSubmitted ? "waiting" : "celebrating");
      setEverSubmitted(true);
      resetSubmit();
    }
  }, [submitted, everSubmitted, resetSubmit]);

  useEffect(() => {
    if (photoSaved) {
      freeze("photo");
      resetPhoto();
    }
  }, [photoSaved, freeze, resetPhoto]);

  const stage: PendingStage = loading
    ? "loading"
    : me === null
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

  const pickPhoto = useCallback(async () => {
    setPicking(true);
    setPickFailed(false);

    try {
      const picked = await pickAndShrinkPhoto(PHOTO_PICK_DEPS);

      if (picked !== null && me) {
        sendPhoto({ userId: me.id, ...picked });
      }
    } catch {
      setPickFailed(true);
    } finally {
      setPicking(false);
    }
  }, [me, sendPhoto]);

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
    email: me?.email ?? "",
    photoUrl: profile?.photoUrl ?? me?.googlePhotoUrl ?? null,
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
      open === null ? PENDING_FORM_COPY.reviewing : PENDING_FORM_COPY.writing,
    nameLine: `${values.name}${PENDING_FORM_COPY.greetingSuffix}`,
    genderLine: spellGender(values.gender),
    genderValue: values.gender ?? "",
    birthDateLine: spellBirthDate(values.birthDate),
    phoneLine: hyphenatePhone(values.phone),
    birthDateGuide: guideOf("birthDate"),
    phoneGuide: guideOf("phone"),
    uploading: picking || savingPhoto,
    photoFailed: pickFailed || photoSaveFailed,
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
    touch: (step: Step) =>
      setTouched((at) => (at.includes(step) ? at : [...at, step])),
    thaw: (step: Step) =>
      setFrozen((at) => at.filter((frozenStep) => frozenStep !== step)),
    freezePhoto: () => freeze("photo"),
    pickPhoto,
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
